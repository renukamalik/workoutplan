import { q } from '@/lib/db';
import { requireClient } from '@/lib/auth';
import PlanView from '@/components/PlanView';

export default async function MyPlan() {
  const c = await requireClient();
  const plans = await q<any>(`SELECT * FROM plans WHERE client_id=$1 ORDER BY created_at DESC`, [c.clientId]);
  if (!plans.length) return <div className="card"><h2>Your plan is on its way</h2><p className="muted">Your coach is preparing it. You will get a message when it is ready.</p></div>;
  const p = plans[0];
  const done = await q<any>(`SELECT item_id FROM completions WHERE client_id=$1 AND plan_id=$2`, [c.clientId, p.id]);
  return <PlanView title={p.title} clientName={c.name.split(' ')[0]} data={p.data} planId={p.id} doneIds={done.map((d: any) => d.item_id)} />;
}
