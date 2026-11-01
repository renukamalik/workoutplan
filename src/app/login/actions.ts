'use server';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { createSession, destroySession, getSession } from '@/lib/auth';

export async function loginAction(_: any, form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  const role = String(form.get('role') || 'client');
  const rows = await q<any>(`SELECT * FROM users WHERE email=$1`, [email]);
  const u = rows[0];
  const ok = u && u.active && (await bcrypt.compare(password, u.password_hash));
  if (!ok || (role === 'admin') !== (u.role === 'admin')) {
    return { error: 'That email and password do not match. Check them and try again.' };
  }
  await q(`UPDATE users SET last_login=now() WHERE id=$1`, [u.id]);
  await createSession(u);
  redirect(u.must_change ? '/change-password' : u.role === 'admin' ? '/dashboard' : '/me');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}

export async function changePasswordAction(_: any, form: FormData) {
  const s = await getSession();
  if (!s) redirect('/login');
  const a = String(form.get('password') || '');
  const b = String(form.get('confirm') || '');
  if (a.length < 8) return { error: 'Use at least 8 characters.' };
  if (a !== b) return { error: 'The two passwords do not match.' };
  const hash = await bcrypt.hash(a, 10);
  await q(`UPDATE users SET password_hash=$1, must_change=FALSE WHERE id=$2`, [hash, s.uid]);
  const rows = await q<any>(`SELECT * FROM users WHERE id=$1`, [s.uid]);
  await createSession(rows[0]);
  redirect(s.role === 'admin' ? '/dashboard' : '/me');
}
