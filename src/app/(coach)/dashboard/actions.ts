'use server';
import { q } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { weeklyBriefing } from '@/lib/ai';

// Only first names and counts go to Claude. No health notes, phone numbers or emails.
export async function briefingAction() {
  await requireAdmin();
  try {
    const first = (n: string) => n.split(' ')[0];
    const [c] = await q<any>(`SELECT count(*)::int total, count(*) FILTER (WHERE status='active')::int active, count(*) FILTER (WHERE status='invited')::int invited FROM clients`);
    const quiet = await q<any>(`SELECT u.name, max(ch.created_at) last FROM clients cl JOIN users u ON u.id=cl.user_id LEFT JOIN checkins ch ON ch.client_id=cl.id WHERE cl.status='active' GROUP BY u.name HAVING max(ch.created_at) IS NULL OR max(ch.created_at) < now() - interval '8 days'`);
    const renew = await q<any>(`SELECT u.name, cl.plan_length FROM clients cl JOIN users u ON u.id=cl.user_id WHERE cl.status='active' AND cl.start_date IS NOT NULL AND cl.start_date + (CASE WHEN cl.plan_length='quarterly' THEN 84 ELSE 28 END) <= current_date + 7`);
    const pain = await q<any>(`SELECT DISTINCT u.name FROM checkins ch JOIN clients cl ON cl.id=ch.client_id JOIN users u ON u.id=cl.user_id WHERE ch.created_at > now() - interval '14 days' AND (coalesce(ch.leg,0)>=5 OR coalesce(ch.back,0)>=5 OR coalesce(ch.pelvic,0)>=7)`);
    const noPlan = await q<any>(`SELECT u.name FROM clients cl JOIN users u ON u.id=cl.user_id WHERE NOT EXISTS (SELECT 1 FROM plans p WHERE p.client_id=cl.id)`);
    const text = await weeklyBriefing({
      clients: c, noCheckinFor8Days: quiet.map((r: any) => first(r.name)), renewalsDueThisWeek: renew.map((r: any) => ({ name: first(r.name), length: r.plan_length })),
      highSymptomScoresLast14Days: pain.map((r: any) => first(r.name)), clientsWithoutAPlan: noPlan.map((r: any) => first(r.name)),
    });
    return { text };
  } catch (e: any) { return { error: e.message || 'Claude could not write the briefing.' }; }
}
