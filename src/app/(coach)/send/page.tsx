import { q } from '@/lib/db';
import { appUrl } from '@/lib/auth';
import SendForm from '@/components/SendForm';

export default async function Send() {
  const clients = await q<any>(`SELECT cl.id, u.name, u.email, u.phone FROM clients cl JOIN users u ON u.id=cl.user_id WHERE u.active ORDER BY u.name`);
  const plans = await q<any>(`SELECT p.id, p.title FROM plans p ORDER BY p.is_template DESC, p.updated_at DESC`);
  const groups = await q<any>(`SELECT g.id, g.name, coalesce(array_agg(m.client_id) FILTER (WHERE m.client_id IS NOT NULL), '{}') members FROM groups g LEFT JOIN group_members m ON m.group_id=g.id GROUP BY g.id, g.name ORDER BY g.name`);
  return (
    <>
      <div><h1>Send plans</h1><p className="muted">Send a plan, a weekly reminder or a renewal to one client or a whole group.</p></div>
      <SendForm clients={clients} groups={groups} plans={plans} appUrl={appUrl()} emailReady={!!process.env.RESEND_API_KEY} />
    </>
  );
}
