'use server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { q, newId } from '@/lib/db';
import { requireAdmin, tempPassword } from '@/lib/auth';

const num = (v: FormDataEntryValue | null) => { const n = parseFloat(String(v ?? '')); return Number.isFinite(n) ? n : null; };
const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

async function flash(id: string, pw: string) {
  (await cookies()).set('rerise_flash', JSON.stringify({ id, pw }), { httpOnly: true, path: '/clients', maxAge: 600, sameSite: 'lax' });
}

export async function createClientAction(_: any, f: FormData) {
  await requireAdmin();
  const email = str(f, 'email').toLowerCase();
  const name = str(f, 'name');
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter her name and a valid email address.' };
  if ((await q(`SELECT 1 FROM users WHERE email=$1`, [email])).length) return { error: 'A login with this email already exists.' };
  const pw = tempPassword();
  const uid = newId(), cid = newId();
  await q(`INSERT INTO users (id, role, email, name, phone, password_hash, must_change) VALUES ($1,'client',$2,$3,$4,$5,TRUE)`,
    [uid, email, name, str(f, 'phone'), await bcrypt.hash(pw, 10)]);
  await q(`INSERT INTO clients (id, user_id, goal, age, health_notes, consent, plan_length, start_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'invited')`,
    [cid, uid, str(f, 'goal') || 'Get stronger', num(f.get('age')), str(f, 'health_notes'), f.get('consent') === 'on', str(f, 'plan_length') || 'monthly', str(f, 'start_date') || null]);
  const tpl = await q<any>(`SELECT * FROM plans WHERE id=$1 AND is_template`, [str(f, 'template')]);
  if (tpl[0]) {
    await q(`INSERT INTO plans (id, client_id, title, kind, is_template, data) VALUES ($1,$2,$3,$4,FALSE,$5)`,
      [newId(), cid, `${name}: ${tpl[0].title}`, tpl[0].kind, JSON.stringify(tpl[0].data)]);
  }
  await flash(cid, pw);
  revalidatePath('/clients');
  redirect(`/clients/${cid}`);
}

export async function updateClientAction(id: string, f: FormData) {
  await requireAdmin();
  const [cl] = await q<any>(`SELECT user_id FROM clients WHERE id=$1`, [id]);
  if (!cl) return;
  await q(`UPDATE users SET name=$1, phone=$2 WHERE id=$3`, [str(f, 'name'), str(f, 'phone'), cl.user_id]);
  const email = str(f, 'email').toLowerCase();
  if (/^\S+@\S+\.\S+$/.test(email)) await q(`UPDATE users SET email=$1 WHERE id=$2 AND NOT EXISTS (SELECT 1 FROM users WHERE email=$1 AND id<>$2)`, [email, cl.user_id]);
  await q(`UPDATE clients SET goal=$1, age=$2, height_cm=$3, weight_kg=$4, health_notes=$5, consent=$6, plan_length=$7, start_date=$8, status=$9, coach_notes=$10 WHERE id=$11`,
    [str(f, 'goal'), num(f.get('age')), num(f.get('height_cm')), num(f.get('weight_kg')), str(f, 'health_notes'), f.get('consent') === 'on', str(f, 'plan_length'), str(f, 'start_date') || null, str(f, 'status'), str(f, 'coach_notes'), id]);
  revalidatePath(`/clients/${id}`); revalidatePath('/clients');
}

export async function resetPasswordAction(id: string) {
  await requireAdmin();
  const [cl] = await q<any>(`SELECT user_id FROM clients WHERE id=$1`, [id]);
  if (!cl) return;
  const pw = tempPassword();
  await q(`UPDATE users SET password_hash=$1, must_change=TRUE, active=TRUE WHERE id=$2`, [await bcrypt.hash(pw, 10), cl.user_id]);
  await flash(id, pw);
  revalidatePath(`/clients/${id}`);
}

export async function setActiveAction(id: string, active: boolean) {
  await requireAdmin();
  await q(`UPDATE users SET active=$1 WHERE id=(SELECT user_id FROM clients WHERE id=$2)`, [active, id]);
  revalidatePath(`/clients/${id}`);
}

export async function deleteClientAction(id: string) {
  await requireAdmin();
  await q(`DELETE FROM users WHERE id=(SELECT user_id FROM clients WHERE id=$1)`, [id]);
  revalidatePath('/clients');
  redirect('/clients');
}

export async function assignPlanAction(id: string, f: FormData) {
  await requireAdmin();
  const [tpl] = await q<any>(`SELECT * FROM plans WHERE id=$1`, [str(f, 'template')]);
  const [u] = await q<any>(`SELECT u.name FROM clients cl JOIN users u ON u.id=cl.user_id WHERE cl.id=$1`, [id]);
  if (tpl && u) {
    await q(`INSERT INTO plans (id, client_id, title, kind, is_template, data) VALUES ($1,$2,$3,$4,FALSE,$5)`,
      [newId(), id, `${u.name}: ${tpl.title}`, tpl.kind, JSON.stringify(tpl.data)]);
  }
  revalidatePath(`/clients/${id}`);
}
