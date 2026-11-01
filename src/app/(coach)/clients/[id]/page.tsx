import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import { appUrl } from '@/lib/auth';
import { waLink } from '@/lib/plan';
import { updateClientAction, resetPasswordAction, setActiveAction, deleteClientAction, assignPlanAction } from '../actions';
import CopyButton from '@/components/CopyButton';

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c] = await q<any>(`SELECT cl.*, u.name, u.email, u.phone, u.active, u.last_login, u.must_change FROM clients cl JOIN users u ON u.id=cl.user_id WHERE cl.id=$1`, [id]);
  if (!c) notFound();
  const plans = await q<any>(`SELECT id, title, kind, updated_at FROM plans WHERE client_id=$1 ORDER BY created_at DESC`, [id]);
  const templates = await q<any>(`SELECT id, title FROM plans WHERE is_template ORDER BY created_at`);
  const checkins = await q<any>(`SELECT * FROM checkins WHERE client_id=$1 ORDER BY created_at DESC LIMIT 12`, [id]);
  let fl: any = null;
  try { const raw = (await cookies()).get('rerise_flash')?.value; if (raw) fl = JSON.parse(raw); } catch {}
  const pw = fl && fl.id === id ? fl.pw : null;
  const msg = pw
    ? `Hi ${c.name.split(' ')[0]}, welcome to Rerise! Your plan is ready. Log in here: ${appUrl()}\n\nEmail: ${c.email}\nTemporary password: ${pw}\n\nYou will be asked to set your own password. See you in our live session. Coach Renuka`
    : '';
  const update = updateClientAction.bind(null, id);
  const date = c.start_date ? new Date(c.start_date).toISOString().slice(0, 10) : '';
  return (
    <>
      <div className="row between">
        <div><p className="small"><Link href="/clients">Clients</Link> / </p><h1>{c.name}</h1>
          <p className="muted">{c.active ? (c.last_login ? `Last login ${new Date(c.last_login).toLocaleDateString('en-IN')}` : 'Has not logged in yet') : 'Login switched off'}</p></div>
        <span className={`chip ${c.status === 'active' ? 'ok' : c.status === 'invited' ? 'warn' : 'off'}`}>{c.status}</span>
      </div>

      {pw && (
        <section className="card" style={{ borderColor: 'var(--accent)' }}>
          <h3>Share login with {c.name.split(' ')[0]}</h3>
          <p className="small muted">The temporary password is shown now and for 10 minutes. It stops working once she sets her own.</p>
          <div className="row">
            <div className="stat" style={{ flex: '1 1 220px' }}><span>Email (username)</span><div style={{ fontWeight: 700 }}>{c.email}</div></div>
            <div className="stat" style={{ flex: '1 1 220px' }}><span>Temporary password</span><div style={{ fontWeight: 700, letterSpacing: '.04em' }}>{pw}</div></div>
          </div>
          <div className="bubble">{msg}</div>
          <p className="small muted">The message has no health details in it.</p>
          <div className="row">
            {c.phone && <a className="btn wa" href={waLink(c.phone, msg)} target="_blank" rel="noopener">Send on WhatsApp</a>}
            <a className="btn primary" href={`mailto:${c.email}?subject=${encodeURIComponent('Your Rerise login')}&body=${encodeURIComponent(msg)}`}>Send by email</a>
            <CopyButton text={msg} label="Copy message" />
          </div>
        </section>
      )}

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <form action={update} className="card" style={{ flex: '2 1 480px' }}>
          <h3>Profile</h3>
          <div className="row">
            <label className="fld" style={{ flex: '1 1 220px' }}>Full name<input name="name" defaultValue={c.name} required /></label>
            <label className="fld" style={{ flex: '1 1 220px' }}>Email (login)<input type="email" name="email" defaultValue={c.email} required /></label>
            <label className="fld" style={{ flex: '1 1 160px' }}>WhatsApp<input name="phone" defaultValue={c.phone} /></label>
          </div>
          <div className="row">
            <label className="fld" style={{ flex: '1 1 80px' }}>Age<input name="age" defaultValue={c.age ?? ''} inputMode="numeric" /></label>
            <label className="fld" style={{ flex: '1 1 100px' }}>Height (cm)<input name="height_cm" defaultValue={c.height_cm ?? ''} inputMode="numeric" /></label>
            <label className="fld" style={{ flex: '1 1 100px' }}>Weight (kg)<input name="weight_kg" defaultValue={c.weight_kg ?? ''} inputMode="decimal" /></label>
            <label className="fld" style={{ flex: '2 1 200px' }}>Goal<input name="goal" defaultValue={c.goal} /></label>
          </div>
          <label className="fld">Health notes<textarea name="health_notes" rows={3} defaultValue={c.health_notes} /></label>
          <div className="row">
            <label className="fld" style={{ flex: '1 1 160px' }}>Plan length
              <select name="plan_length" defaultValue={c.plan_length}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label>
            <label className="fld" style={{ flex: '1 1 160px' }}>Start date<input type="date" name="start_date" defaultValue={date} /></label>
            <label className="fld" style={{ flex: '1 1 160px' }}>Status
              <select name="status" defaultValue={c.status}><option value="invited">Invited</option><option value="active">Active</option><option value="finished">Finished</option></select></label>
          </div>
          <label className="fld">Coach notes (only you see these)<textarea name="coach_notes" rows={3} defaultValue={c.coach_notes} /></label>
          <label className="row" style={{ flexWrap: 'nowrap' }}><input type="checkbox" name="consent" defaultChecked={c.consent} style={{ width: 20, height: 20 }} /> She has agreed that I store her health details.</label>
          <div className="row"><button className="btn primary">Save changes</button></div>
        </form>

        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="card">
            <h3>Plans</h3>
            {plans.length === 0 && <p className="muted small">No plan yet. Pick a template below.</p>}
            {plans.map((p: any) => (
              <div key={p.id} className="row between">
                <Link href={`/plans/${p.id}`} style={{ fontWeight: 700 }}>{p.title}</Link>
                <span className="chip off" style={{ textTransform: 'capitalize' }}>{p.kind}</span>
              </div>
            ))}
            <form action={assignPlanAction.bind(null, id)} className="row" style={{ flexWrap: 'nowrap' }}>
              <select name="template" className="in" style={{ flex: 1, minWidth: 0 }} aria-label="Template">{templates.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
              <button className="btn sm">Add plan</button>
            </form>
          </section>
          <section className="card">
            <h3>Login</h3>
            <form action={resetPasswordAction.bind(null, id)}><button className="btn" style={{ width: '100%' }}>Reset password and show new one</button></form>
            <form action={setActiveAction.bind(null, id, !c.active)}><button className="btn" style={{ width: '100%' }}>{c.active ? 'Switch login off' : 'Switch login on'}</button></form>
            <form action={deleteClientAction.bind(null, id)}><button className="btn danger" style={{ width: '100%' }}>Delete client and all her data</button></form>
            <p className="small muted">Deleting cannot be undone. Export a backup first from the Admin tab.</p>
          </section>
        </div>
      </div>

      <section className="card">
        <h3>Weekly check-ins</h3>
        {checkins.length === 0 ? <p className="muted">No check-ins yet.</p> : (
          <div className="tablewrap"><table>
            <thead><tr><th>Date</th><th>Week</th><th>Sessions</th><th>Leg</th><th>Back</th><th>Pelvic</th><th>Energy</th><th>Neck</th><th>Notes</th></tr></thead>
            <tbody>{checkins.map((r: any) => (
              <tr key={r.id}><td>{new Date(r.created_at).toLocaleDateString('en-IN')}</td><td>{r.week}</td><td>{r.sessions ?? '-'}</td><td>{r.leg ?? '-'}</td><td>{r.back ?? '-'}</td><td>{r.pelvic ?? '-'}</td><td>{r.energy ?? '-'}</td><td>{r.neck ?? '-'}</td>
                <td className="small" style={{ minWidth: 200 }}>{[r.best && `Best: ${r.best}`, r.discuss && `Discuss: ${r.discuss}`, r.notes].filter(Boolean).join(' · ')}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
