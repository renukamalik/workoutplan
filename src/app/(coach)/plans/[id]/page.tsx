import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import PlanEditor from '@/components/PlanEditor';
import { duplicatePlanAction, deletePlanAction } from '../actions';

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await q<any>(`SELECT p.*, u.name AS client_name FROM plans p LEFT JOIN clients cl ON cl.id=p.client_id LEFT JOIN users u ON u.id=cl.user_id WHERE p.id=$1`, [id]);
  if (!p) notFound();
  return (
    <>
      <div className="row between">
        <div><p className="small"><Link href="/plans">Plans</Link> / </p><h1>{p.is_template ? 'Template' : p.client_name}</h1></div>
        <div className="row">
          <Link className="btn" href={`/plans/${id}/print`}>Download PDF</Link>
          <form action={duplicatePlanAction.bind(null, id, true)}><button className="btn">Save as template</button></form>
          <form action={duplicatePlanAction.bind(null, id, false)}><button className="btn">Duplicate</button></form>
          <form action={deletePlanAction.bind(null, id)}><button className="btn danger">Delete</button></form>
        </div>
      </div>
      <PlanEditor id={id} title={p.title} kind={p.kind} data={p.data} />
    </>
  );
}
