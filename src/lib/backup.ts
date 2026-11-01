import bcrypt from 'bcryptjs';
import { q, newId } from './db';

const TABLES = ['users', 'clients', 'plans', 'checkins', 'completions', 'groups', 'group_members', 'sends'] as const;

export async function exportAll() {
  const out: Record<string, any[]> = {};
  for (const t of TABLES) {
    out[t] = t === 'users'
      ? await q(`SELECT id, role, email, name, phone, must_change, active, created_at FROM users ORDER BY created_at`)
      : await q(`SELECT * FROM ${t}`);
  }
  return { app: 'rerise', version: 1, exportedAt: new Date().toISOString(), note: 'Passwords are not included. Imported clients get a new temporary password.', ...out };
}

const csvCell = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export async function clientsCsv() {
  const rows = await q<any>(`SELECT u.name, u.email, u.phone, cl.goal, cl.age, cl.height_cm, cl.weight_kg, cl.plan_length, cl.start_date, cl.status, cl.health_notes, cl.consent
    FROM clients cl JOIN users u ON u.id=cl.user_id ORDER BY u.name`);
  const head = ['name', 'email', 'phone', 'goal', 'age', 'height_cm', 'weight_kg', 'plan_length', 'start_date', 'status', 'health_notes', 'consent'];
  return [head.join(','), ...rows.map((r) => head.map((h) => csvCell(h === 'start_date' && r[h] ? new Date(r[h]).toISOString().slice(0, 10) : r[h])).join(','))].join('\n');
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; }
    else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some((c) => c.trim())) rows.push(row); row = []; }
    else cur += ch;
  }
  row.push(cur); if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

export async function importClientsCsv(text: string, makePw: () => string) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { added: 0, skipped: 0, logins: [] as { name: string; email: string; pw: string }[], error: 'The file has no rows.' };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (k: string) => head.indexOf(k);
  if (idx('name') < 0 || idx('email') < 0) return { added: 0, skipped: 0, logins: [], error: 'The first row must include name and email columns.' };
  let added = 0, skipped = 0; const logins: { name: string; email: string; pw: string }[] = [];
  for (const r of rows.slice(1)) {
    const g = (k: string) => (idx(k) >= 0 ? (r[idx(k)] ?? '').trim() : '');
    const email = g('email').toLowerCase(); const name = g('name');
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || (await q(`SELECT 1 FROM users WHERE email=$1`, [email])).length) { skipped++; continue; }
    const pw = makePw(); const uid = newId(), cid = newId();
    await q(`INSERT INTO users (id, role, email, name, phone, password_hash, must_change) VALUES ($1,'client',$2,$3,$4,$5,TRUE)`, [uid, email, name, g('phone'), await bcrypt.hash(pw, 10)]);
    const num = (k: string) => { const n = parseFloat(g(k)); return Number.isFinite(n) ? n : null; };
    await q(`INSERT INTO clients (id, user_id, goal, age, height_cm, weight_kg, health_notes, consent, plan_length, start_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [cid, uid, g('goal') || 'Get stronger', num('age'), num('height_cm'), num('weight_kg'), g('health_notes'), /^(true|yes|1)$/i.test(g('consent')), g('plan_length') === 'quarterly' ? 'quarterly' : 'monthly', g('start_date') || null, ['active', 'finished'].includes(g('status')) ? g('status') : 'invited']);
    added++; logins.push({ name, email, pw });
  }
  return { added, skipped, logins };
}

/** Restore from a JSON backup: adds missing clients, plans, check-ins. Existing records are kept. */
export async function importJson(raw: any, makePw: () => string) {
  if (!raw || raw.app !== 'rerise') return { error: 'This is not a Rerise backup file.' };
  const logins: { name: string; email: string; pw: string }[] = [];
  const idMap = new Map<string, string>();
  let clientsAdded = 0, plansAdded = 0, checkinsAdded = 0;
  const users = new Map<string, any>((raw.users || []).map((u: any) => [u.id, u]));
  for (const c of raw.clients || []) {
    const u = users.get(c.user_id); if (!u) continue;
    const email = String(u.email).toLowerCase();
    const ex = await q<any>(`SELECT cl.id FROM users u JOIN clients cl ON cl.user_id=u.id WHERE u.email=$1`, [email]);
    if (ex[0]) { idMap.set(c.id, ex[0].id); continue; }
    const pw = makePw(); const uid = newId(), cid = newId();
    await q(`INSERT INTO users (id, role, email, name, phone, password_hash, must_change, active) VALUES ($1,'client',$2,$3,$4,$5,TRUE,$6)`, [uid, email, u.name, u.phone || '', await bcrypt.hash(pw, 10), u.active !== false]);
    await q(`INSERT INTO clients (id, user_id, goal, age, height_cm, weight_kg, health_notes, consent, plan_length, start_date, status, coach_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [cid, uid, c.goal || 'Get stronger', c.age, c.height_cm, c.weight_kg, c.health_notes || '', !!c.consent, c.plan_length || 'monthly', c.start_date ? String(c.start_date).slice(0, 10) : null, c.status || 'invited', c.coach_notes || '']);
    idMap.set(c.id, cid); clientsAdded++; logins.push({ name: u.name, email, pw });
  }
  for (const p of raw.plans || []) {
    const cid = p.client_id ? idMap.get(p.client_id) : null;
    if (p.client_id && !cid) continue;
    const dup = await q(`SELECT 1 FROM plans WHERE title=$1 AND coalesce(client_id,'')=coalesce($2,'')`, [p.title, cid || null]);
    if (dup.length) continue;
    await q(`INSERT INTO plans (id, client_id, title, kind, is_template, data) VALUES ($1,$2,$3,$4,$5,$6)`, [newId(), cid || null, p.title, p.kind || 'monthly', !!p.is_template, JSON.stringify(p.data)]);
    plansAdded++;
  }
  for (const k of raw.checkins || []) {
    const cid = idMap.get(k.client_id); if (!cid) continue;
    const dup = await q(`SELECT 1 FROM checkins WHERE client_id=$1 AND created_at=$2`, [cid, k.created_at]);
    if (dup.length) continue;
    await q(`INSERT INTO checkins (id, client_id, week, sessions, leg, back, pelvic, energy, neck, best, discuss, notes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [newId(), cid, k.week || '', k.sessions, k.leg, k.back, k.pelvic, k.energy, k.neck, k.best || '', k.discuss || '', k.notes || '', k.created_at]);
    checkinsAdded++;
  }
  return { clientsAdded, plansAdded, checkinsAdded, logins };
}
