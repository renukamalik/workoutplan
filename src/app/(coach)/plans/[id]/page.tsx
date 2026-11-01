import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import { appUrl, shareCode } from '@/lib/auth';
import { aiReady } from '@/lib/ai';
import SendPlanPanel from '@/components/SendPlanPanel';
import PlanEditor from '@/components/PlanEditor';
import { duplicatePlanAction, deletePlanAction } from '../actions';

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [p] = await q<any>(`SELECT p.*, u.name AS client_name, u.email AS client_email, u.phone AS client_phone FROM plans p LEFT JOIN clients cl ON cl.id=p.client_id LEFT JOIN users u ON u.id=cl.user_id WHERE p.id=$1`, [id]);
  if (!p) notFound();
  const pdfLink = p.client_id ? `${appUrl()}/p/${await shareCode(id)}` : '';
  return (
    <>
      <div className="row between">
        <div><p className="small"><Link href="/plans">Plans</Link> / </p><h1>{p.is_template ? 'Template' : p.client_name}</h1></div>
        <div className="row">
          {p.client_id && <a className="btn primary" href="#send">Send to client</a>}
          <Link className="btn" href={`/api/plans/${id}/pdf`} target="_blank">Download PDF</Link>
          <form action={duplicatePlanAction.bind(null, id, true)}><button className="btn">Save as template</button></form>
          <form action={duplicatePlanAction.bind(null, id, false)}><button className="btn">Duplicate</button></form>
          <form action={deletePlanAction.bind(null, id)}><button className="btn danger">Delete</button></form>
        </div>
      </div>
      {sp.new && <p className="notice ok" role="status">Plan created for {p.client_name}. Edit anything below, press Save plan, then send it at the bottom of the page.</p>}
      <PlanEditor id={id} title={p.title} kind={p.kind} data={p.data} aiReady={aiReady()} />
      {p.client_id && <SendPlanPanel planId={id} clientId={p.client_id} name={p.client_name} phone={p.client_phone || ''} email={p.client_email} pdfLink={pdfLink} appUrl={appUrl()} emailReady={!!process.env.RESEND_API_KEY} />}
    </>
  );
}
