'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { q } from '@/lib/db';
import { requireAdmin, tempPassword } from '@/lib/auth';
import { importClientsCsv, importJson } from '@/lib/backup';

export async function importAction(_: any, f: FormData) {
  await requireAdmin();
  const file = f.get('file') as File | null;
  if (!file || !file.size) return { error: 'Choose a file first.' };
  const text = await file.text();
  try {
    const res: any = file.name.toLowerCase().endsWith('.json') ? await importJson(JSON.parse(text), tempPassword) : await importClientsCsv(text, tempPassword);
    revalidatePath('/clients'); revalidatePath('/admin');
    return res;
  } catch { return { error: 'That file could not be read. Use a Rerise backup (.json) or a clients file (.csv).' }; }
}

export async function changeMyPasswordAction(_: any, f: FormData) {
  const s = await requireAdmin();
  const a = String(f.get('password') || '');
  if (a.length < 8) return { error: 'Use at least 8 characters.' };
  await q(`UPDATE users SET password_hash=$1, must_change=FALSE WHERE id=$2`, [await bcrypt.hash(a, 10), s.uid]);
  return { ok: 'Your password is changed.' };
}

export async function resetUserAction(userId: string) {
  await requireAdmin();
  const pw = tempPassword();
  await q(`UPDATE users SET password_hash=$1, must_change=TRUE, active=TRUE WHERE id=$2 AND role='client'`, [await bcrypt.hash(pw, 10), userId]);
  const [u] = await q<any>(`SELECT name, email FROM users WHERE id=$1`, [userId]);
  revalidatePath('/admin');
  return { name: u?.name, email: u?.email, pw };
}
