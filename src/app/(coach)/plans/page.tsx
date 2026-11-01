import Link from 'next/link';
import { q } from '@/lib/db';
import { newBlankTemplateAction } from './actions';

export default async function Plans() {
  const templates = await q<any>(`SELECT id, title, kind, updated_at FROM plans WHERE is_template ORDER BY created_at`);
  const plans = await q<any>(`SELECT p.id, p.title, p.kind, p.updated_at, u.name FROM plans p JOIN clients cl ON cl.id=p.client_id JOIN users u ON u.id=cl.user_id ORDER BY p.updated_at DESC`);
  return (
    <>
      <div className="row between">
        <div><h1>Plans</h1><p className="muted">Templates you reuse, and each client's own plan. Add your video links inside a plan.</p></div>
        <form action={newBlankTemplateAction}><button className="btn primary">New template</button></form>
      </div>
      <section className="card">
        <h3>Templates</h3>
        <div className="tablewrap"><table><thead><tr><th>Name</th><th>Length</th><th>Updated</th><th></th></tr></thead><tbody>
          {templates.map((p: any) => (<tr key={p.id}><td style={{ fontWeight: 700 }}>{p.title}</td><td style={{ textTransform: 'capitalize' }}>{p.kind}</td><td className="small">{new Date(p.updated_at).toLocaleDateString('en-IN')}</td><td><Link className="btn sm" href={`/plans/${p.id}`}>Edit</Link></td></tr>))}
        </tbody></table></div>
      </section>
      <section className="card">
        <h3>Client plans</h3>
        <div className="tablewrap"><table><thead><tr><th>Client</th><th>Plan</th><th>Length</th><th>Updated</th><th></th></tr></thead><tbody>
          {plans.length === 0 && <tr><td colSpan={5} className="muted">No client plans yet. Add a client and pick a template.</td></tr>}
          {plans.map((p: any) => (<tr key={p.id}><td style={{ fontWeight: 700 }}>{p.name}</td><td>{p.title}</td><td style={{ textTransform: 'capitalize' }}>{p.kind}</td><td className="small">{new Date(p.updated_at).toLocaleDateString('en-IN')}</td><td><Link className="btn sm" href={`/plans/${p.id}`}>Edit</Link></td></tr>))}
        </tbody></table></div>
      </section>
    </>
  );
}
