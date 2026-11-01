'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { q, newId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { generatePlan, sendsHealthNotes } from '@/lib/ai';

export async function createPlanAction(_: any, f: FormData) {
  await requireAdmin();
  const clientId = String(f.get('client') || '');
  const source = String(f.get('source') || '');
  const kind = f.get('kind') === 'quarterly' ? 'quarterly' : 'monthly';
  const [c] = await q<any>(`SELECT cl.id, cl.goal, cl.age, cl.health_notes, cl.consent, u.name FROM clients cl JOIN users u ON u.id=cl.user_id WHERE cl.id=$1`, [clientId]);
  if (!c) return { error: 'Pick a client first.' };
  let title = '', data: any, usedKind = kind;
  if (source === 'ai') {
    try {
      const r = await generatePlan({
        age: c.age, goal: c.goal, kind,
        health: c.consent && sendsHealthNotes() ? c.health_notes : '', // health notes only go to the AI if she has agreed and the provider is paid (or you allowed it)
        notes: String(f.get('notes') || '').slice(0, 1200), days: Math.min(6, Math.max(2, parseInt(String(f.get('days') || '5'), 10) || 5)),
      });
      title = `${c.name}: ${r.title}`; data = r.data;
    } catch (e: any) { return { error: e.message || 'The AI could not write the plan.' }; }
  } else {
    const [t] = await q<any>(`SELECT * FROM plans WHERE id=$1 AND is_template`, [source.replace('t:', '')]);
    if (!t) return { error: 'Pick a template, or choose Write with AI.' };
    title = `${c.name}: ${t.title}`; data = t.data; usedKind = t.kind;
  }
  const id = newId();
  await q(`INSERT INTO plans (id, client_id, title, kind, is_template, data) VALUES ($1,$2,$3,$4,FALSE,$5)`, [id, clientId, title.slice(0, 160), usedKind, JSON.stringify(data)]);
  revalidatePath('/plans');
  redirect(`/plans/${id}?new=1`);
}
