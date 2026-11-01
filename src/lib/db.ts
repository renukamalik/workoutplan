import bcrypt from 'bcryptjs';
import template from './template.json';

type Row = Record<string, any>;
type Runner = { query: (sql: string, params?: any[]) => Promise<Row[]>; exec: (sql: string) => Promise<void> };

const g = globalThis as unknown as { __runner?: Promise<Runner>; __ready?: Promise<void> };

async function makeRunner(): Promise<Runner> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import('pg');
    const ssl = /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false };
    const pool = new Pool({ connectionString: url, ssl, max: 5 });
    return {
      query: async (sql, params) => (await pool.query(sql, params)).rows,
      exec: async (sql) => { await pool.query(sql); },
    };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const { mkdirSync } = await import('node:fs');
  const dir = process.env.PGLITE_DIR || './.data/pglite';
  mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  return {
    query: async (sql, params) => (await db.query(sql, params as any[])).rows as Row[],
    exec: async (sql) => { await db.exec(sql); },
  };
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin','client')),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  must_change BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL DEFAULT 'Get stronger',
  age INT,
  height_cm INT,
  weight_kg NUMERIC,
  health_notes TEXT NOT NULL DEFAULT '',
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  plan_length TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE,
  status TEXT NOT NULL DEFAULT 'invited',
  coach_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'monthly',
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week TEXT NOT NULL DEFAULT '',
  sessions INT,
  leg INT, back INT, pelvic INT, energy INT, neck INT,
  best TEXT NOT NULL DEFAULT '',
  discuss TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS completions (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  PRIMARY KEY (client_id, plan_id, item_id)
);
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, client_id)
);
CREATE TABLE IF NOT EXISTS sends (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  plan_id TEXT REFERENCES plans(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function init(r: Runner) {
  await r.exec(SCHEMA);
  const admins = await r.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
  if (!admins.length) {
    const email = (process.env.ADMIN_EMAIL || 'coach@example.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'change-me-now';
    const hash = await bcrypt.hash(password, 10);
    await r.query(
      `INSERT INTO users (id, role, email, name, password_hash, must_change) VALUES ($1,'admin',$2,'Coach Renuka',$3,$4)`,
      [crypto.randomUUID(), email, hash, !process.env.ADMIN_PASSWORD]
    );
  }
  const tpl = await r.query(`SELECT id FROM plans WHERE is_template LIMIT 1`);
  if (!tpl.length) {
    await r.query(
      `INSERT INTO plans (id, client_id, title, kind, is_template, data) VALUES ($1,NULL,$2,'monthly',TRUE,$3)`,
      [crypto.randomUUID(), 'Beginner strength, Month 1 (5 days)', JSON.stringify(template)]
    );
  }
}

export async function q<T = Row>(sql: string, params: any[] = []): Promise<T[]> {
  if (!g.__runner) g.__runner = makeRunner();
  const r = await g.__runner;
  if (!g.__ready) g.__ready = init(r);
  await g.__ready;
  return (await r.query(sql, params)) as T[];
}

export const newId = () => crypto.randomUUID();
