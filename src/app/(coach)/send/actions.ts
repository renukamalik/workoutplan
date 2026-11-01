'use server';
import { revalidatePath } from 'next/cache';
import { q, newId } from '@/lib/db';
import { requireAdmin, appUrl } from '@/lib/auth';
import { fillTemplate } from '@/lib/plan';

export async function recordSendAction(clientId: string, planId: string | null, channel: string, subject: string) {
  await requireAdmin();
  await q(`INSERT INTO sends (id, client_id, plan_id, channel, subject) VALUES ($1,$2,$3,$4,$5)`, [newId(), clientId, planId || null, channel, subject.slice(0, 200)]);
  revalidatePath('/dashboard');
}

export async function saveGroupAction(name: string, clientIds: string[]) {
  await requireAdmin();
  if (!name.trim() || clientIds.length === 0) return { error: 'Give the group a name and pick at least one client.' };
  const id = newId();
  await q(`INSERT INTO groups (id, name) VALUES ($1,$2)`, [id, name.trim()]);
  for (const c of clientIds) await q(`INSERT INTO group_members (group_id, client_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id, c]);
  revalidatePath('/send');
  return { ok: true };
}

export async function deleteGroupAction(id: string) {
  await requireAdmin();
  await q(`DELETE FROM groups WHERE id=$1`, [id]);
  revalidatePath('/send');
}

export async function emailAllAction(clientIds: string[], planId: string | null, subject: string, message: string) {
  await requireAdmin();
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: 'Email sending is not set up. Add RESEND_API_KEY on Render, or use the Email buttons to send from your own email app.' };
  let sent = 0;
  for (const id of clientIds) {
    const [c] = await q<any>(`SELECT cl.id, u.name, u.email FROM clients cl JOIN users u ON u.id=cl.user_id WHERE cl.id=$1`, [id]);
    if (!c) continue;
    const text = fillTemplate(message, { name: c.name.split(' ')[0], link: appUrl() });
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Rerise <onboarding@resend.dev>', to: [c.email], subject, text }),
    });
    if (res.ok) { sent++; await q(`INSERT INTO sends (id, client_id, plan_id, channel, subject) VALUES ($1,$2,$3,'email',$4)`, [newId(), c.id, planId || null, subject.slice(0, 200)]); }
  }
  revalidatePath('/dashboard');
  return { ok: `Sent ${sent} of ${clientIds.length} emails.` };
}
