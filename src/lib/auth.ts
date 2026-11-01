import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { q } from './db';

const COOKIE = 'rerise_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-only-secret-change-me-please-32chars');

export type Session = { uid: string; role: 'admin' | 'client'; name: string; email: string; mustChange: boolean };

export async function createSession(u: { id: string; role: string; name: string; email: string; must_change: boolean }) {
  const token = await new SignJWT({ role: u.role, name: u.name, email: u.email, mc: u.must_change })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(u.id).setIssuedAt().setExpirationTime('30d').sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() { (await cookies()).delete(COOKIE); }

export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    const rows = await q<any>(`SELECT id, role, name, email, must_change, active FROM users WHERE id=$1`, [payload.sub]);
    const u = rows[0];
    if (!u || !u.active) return null;
    return { uid: u.id, role: u.role, name: u.name, email: u.email, mustChange: u.must_change };
  } catch { return null; }
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect('/login');
  if (s.mustChange) redirect('/change-password');
  if (s.role !== 'admin') redirect('/me');
  return s;
}

export async function requireClient(): Promise<Session & { clientId: string }> {
  const s = await getSession();
  if (!s) redirect('/login');
  if (s.mustChange) redirect('/change-password');
  if (s.role !== 'client') redirect('/dashboard');
  const rows = await q<any>(`SELECT id FROM clients WHERE user_id=$1`, [s.uid]);
  if (!rows[0]) redirect('/login');
  return { ...s, clientId: rows[0].id };
}

export function tempPassword() {
  const words = ['Rise', 'Calm', 'Bold', 'Glow', 'Fit', 'Sun', 'Leaf', 'Moon'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  const c = ['Blue', 'Rose', 'Sage', 'Gold', 'Plum'][Math.floor(Math.random() * 5)];
  return `${w}-${n}-${c}`;
}

export const appUrl = () =>
  (process.env.APP_URL || (process.env.NODE_ENV === 'production' ? 'https://rerise-app.onrender.com' : 'http://localhost:3000')).replace(/\/$/, '');

// Short private link for a client's PDF (for example /p/k3x9a1b2cd). Valid 60 days, renewed when the coach opens the plan after it expires.
export async function shareCode(planId: string): Promise<string> {
  const [p] = await q<any>(`SELECT share_code, share_expires FROM plans WHERE id=$1`, [planId]);
  if (p?.share_code && p.share_expires && new Date(p.share_expires) > new Date(Date.now() + 5 * 864e5)) return p.share_code;
  const code = p?.share_code && p.share_expires && new Date(p.share_expires) > new Date() ? p.share_code : randomBytes(8).toString('base64url').replace(/[-_]/g, 'x').slice(0, 10).toLowerCase();
  await q(`UPDATE plans SET share_code=$1, share_expires=now() + interval '60 days' WHERE id=$2`, [code, planId]);
  return code;
}
