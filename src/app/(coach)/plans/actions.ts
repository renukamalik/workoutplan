'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { q, newId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { PlanData } from '@/lib/plan';

export async function savePlanAction(id: string, title: string, kind: string, data: PlanData) {
  await requireAdmin();
  const clean: PlanData = {
    week: String(data.week || ''), phase: String(data.phase || ''),
    days: (data.days || []).map((d) => ({
      id: String(d.id), name: String(d.name || ''), tag: String(d.tag || ''), focus: String(d.focus || ''), note: String(d.note || ''),
      items: (d.items || []).map((i) => ({ id: String(i.id), name: String(i.name || ''), tag: String(i.tag || ''), sets: String(i.sets || ''), reps: String(i.reps || ''), rest: String(i.rest || ''), cue: String(i.cue || ''), video: String(i.video || '') })),
    })),
  };
  await q(`UPDATE plans SET title=$1, kind=$2, data=$3, updated_at=now() WHERE id=$4`, [title.slice(0, 160) || 'Untitled plan', kind === 'quarterly' ? 'quarterly' : 'monthly', JSON.stringify(clean), id]);
  revalidatePath(`/plans/${id}`); revalidatePath('/plans');
  return { ok: true };
}

export async function duplicatePlanAction(id: string, asTemplate: boolean) {
  await requireAdmin();
  const [p] = await q<any>(`SELECT * FROM plans WHERE id=$1`, [id]);
  if (!p) return;
  const nid = newId();
  await q(`INSERT INTO plans (id, client_id, title, kind, is_template, data) VALUES ($1,$2,$3,$4,$5,$6)`,
    [nid, asTemplate ? null : p.client_id, `${p.title} (copy)`, p.kind, asTemplate, JSON.stringify(p.data)]);
  revalidatePath('/plans');
  redirect(`/plans/${nid}`);
}

export async function newBlankTemplateAction() {
  await requireAdmin();
  const nid = newId();
  const data: PlanData = { week: '1 of 4', phase: 'Foundation', days: [{ id: newId(), name: 'Monday', tag: '', focus: '', note: '', items: [] }] };
  await q(`INSERT INTO plans (id, client_id, title, kind, is_template, data) VALUES ($1,NULL,'New template','monthly',TRUE,$2)`, [nid, JSON.stringify(data)]);
  revalidatePath('/plans');
  redirect(`/plans/${nid}`);
}

export async function deletePlanAction(id: string) {
  await requireAdmin();
  await q(`DELETE FROM plans WHERE id=$1`, [id]);
  revalidatePath('/plans');
  redirect('/plans');
}
