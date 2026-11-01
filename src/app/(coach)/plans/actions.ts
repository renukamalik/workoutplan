'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { q, newId } from '@/lib/db';
import { requireAdmin, appUrl } from '@/lib/auth';
import { revisePlan } from '@/lib/ai';
import { buildPlanPdf } from '@/lib/pdf';
import { cleanPlan, type PlanData } from '@/lib/plan';

export async function savePlanAction(id: string, title: string, kind: string, data: PlanData) {
  await requireAdmin();
  const clean = cleanPlan(data);
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

export async function revisePlanAction(data: PlanData, instruction: string) {
  await requireAdmin();
  if (!instruction.trim()) return { error: 'Tell Claude what to change.' };
  try { return { data: await revisePlan(cleanPlan(data), instruction.trim().slice(0, 1000)) }; }
  catch (e: any) { return { error: e.message || 'Claude could not change the plan.' }; }
}

export async function emailPlanPdfAction(planId: string, subject: string, message: string) {
  await requireAdmin();
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: 'Email sending is not set up. Use the Email button to send from your own email app.' };
  const [p] = await q<any>(`SELECT p.*, u.name, u.email, cl.id AS cid FROM plans p JOIN clients cl ON cl.id=p.client_id JOIN users u ON u.id=cl.user_id WHERE p.id=$1`, [planId]);
  if (!p) return { error: 'Plan not found.' };
  const pdf = await buildPlanPdf({ title: p.title, clientName: p.name, kind: p.kind, data: p.data, appUrl: appUrl() });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Rerise <onboarding@resend.dev>', to: [p.email], subject, text: message,
      attachments: [{ filename: `Rerise-${p.name.replace(/[^A-Za-z0-9]+/g, '-')}.pdf`, content: pdf.toString('base64') }] }),
  });
  if (!res.ok) return { error: 'The email could not be sent. Check RESEND_API_KEY and EMAIL_FROM on Render.' };
  await q(`INSERT INTO sends (id, client_id, plan_id, channel, subject) VALUES ($1,$2,$3,'email',$4)`, [newId(), p.cid, planId, subject.slice(0, 200)]);
  revalidatePath('/dashboard');
  return { ok: `Email with the PDF sent to ${p.email}.` };
}
