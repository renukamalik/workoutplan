import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import PlanView from '@/components/PlanView';
import PrintButton from '@/components/PrintButton';

export default async function PrintPlan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await q<any>(`SELECT p.*, u.name AS client_name FROM plans p LEFT JOIN clients cl ON cl.id=p.client_id LEFT JOIN users u ON u.id=cl.user_id WHERE p.id=$1`, [id]);
  if (!p) notFound();
  return (
    <>
      <div className="row noprint"><PrintButton /><span className="small muted">In the print window, choose Save as PDF.</span></div>
      <PlanView title={p.title} clientName={p.client_name} data={p.data} />
    </>
  );
}
