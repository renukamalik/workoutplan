'use server';
import { revalidatePath } from 'next/cache';
import { q, newId } from '@/lib/db';
import { requireClient } from '@/lib/auth';

const n = (v: FormDataEntryValue | null) => { const x = parseFloat(String(v ?? '')); return Number.isFinite(x) ? x : null; };
const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

export async function toggleDoneAction(planId: string, itemId: string, done: boolean) {
  const c = await requireClient();
  const own = await q(`SELECT 1 FROM plans WHERE id=$1 AND client_id=$2`, [planId, c.clientId]);
  if (!own.length) return;
  if (done) await q(`INSERT INTO completions (client_id, plan_id, item_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [c.clientId, planId, itemId]);
  else await q(`DELETE FROM completions WHERE client_id=$1 AND plan_id=$2 AND item_id=$3`, [c.clientId, planId, itemId]);
}

export async function checkinAction(_: any, f: FormData) {
  const c = await requireClient();
  const score = (k: string) => { const v = n(f.get(k)); return v === null ? null : Math.max(0, Math.min(10, Math.round(v))); };
  await q(`INSERT INTO checkins (id, client_id, week, sessions, leg, back, pelvic, energy, neck, best, discuss, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [newId(), c.clientId, s(f, 'week'), n(f.get('sessions')), score('leg'), score('back'), score('pelvic'), score('energy'), score('neck'), s(f, 'best'), s(f, 'discuss'), s(f, 'notes')]);
  revalidatePath('/me/checkin');
  return { ok: 'Thank you. Your coach will see this before your next live session.' };
}

export async function saveProfileAction(_: any, f: FormData) {
  const c = await requireClient();
  await q(`UPDATE users SET name=$1, phone=$2 WHERE id=$3`, [s(f, 'name') || c.name, s(f, 'phone'), c.uid]);
  await q(`UPDATE clients SET age=$1, height_cm=$2, weight_kg=$3, goal=$4, health_notes=$5, consent=$6 WHERE id=$7`,
    [n(f.get('age')), n(f.get('height_cm')), n(f.get('weight_kg')), s(f, 'goal'), s(f, 'health_notes'), f.get('consent') === 'on', c.clientId]);
  await q(`UPDATE clients SET status='active' WHERE id=$1 AND status='invited'`, [c.clientId]);
  revalidatePath('/me/profile');
  return { ok: 'Profile saved.' };
}
