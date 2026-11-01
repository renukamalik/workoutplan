import { q } from '@/lib/db';
import { aiReady } from '@/lib/ai';
import CreatePlanForm from '@/components/CreatePlanForm';

export default async function Create() {
  const clients = await q<any>(`SELECT cl.id, u.name, cl.goal, cl.plan_length FROM clients cl JOIN users u ON u.id=cl.user_id WHERE u.active ORDER BY u.name`);
  const templates = await q<any>(`SELECT id, title, kind FROM plans WHERE is_template ORDER BY created_at`);
  return (
    <>
      <div><h1>Create plan</h1><p className="muted">Pick a client, start from your Rerise template or let AI write a first draft, then edit everything, make the PDF and send it.</p></div>
      <CreatePlanForm clients={clients} templates={templates} aiReady={aiReady()} />
    </>
  );
}
