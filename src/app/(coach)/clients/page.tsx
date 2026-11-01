import Link from 'next/link';
import { q } from '@/lib/db';

const chip: Record<string, string> = { active: 'ok', invited: 'warn', finished: 'off' };

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const rows = await q<any>(`SELECT cl.id, cl.goal, cl.plan_length, cl.status, cl.start_date, u.name, u.email, u.phone, u.active, u.last_login,
      (SELECT max(created_at) FROM checkins c WHERE c.client_id=cl.id) last_checkin
    FROM clients cl JOIN users u ON u.id=cl.user_id
    WHERE ($1='' OR u.name ILIKE '%'||$1||'%' OR u.email ILIKE '%'||$1||'%' OR u.phone ILIKE '%'||$1||'%')
      AND ($2='' OR cl.status=$2) ORDER BY u.name`, [sp.q || '', sp.status || '']);
  return (
    <>
      <div className="row between">
        <div><h1>Clients</h1><p className="muted">Add a client, give her a login, and see where she is in her plan.</p></div>
        <Link href="/clients/new" className="btn primary">Add client</Link>
      </div>
      <form className="row" method="get">
        <input className="in" style={{ flex: '1 1 240px' }} type="search" name="q" defaultValue={sp.q} placeholder="Search by name, email or number" aria-label="Search clients" />
        <select className="in" name="status" defaultValue={sp.status || ''} aria-label="Status">
          <option value="">All statuses</option><option value="active">Active</option><option value="invited">Invited</option><option value="finished">Finished</option>
        </select>
        <button className="btn">Filter</button>
      </form>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Client</th><th>Plan</th><th>Start</th><th>Status</th><th>Last login</th><th>Last check-in</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted">No clients yet. Add your first client to begin.</td></tr>}
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td><Link href={`/clients/${r.id}`} style={{ fontWeight: 700 }}>{r.name}</Link><div className="small muted">{r.goal}</div></td>
                <td style={{ textTransform: 'capitalize' }}>{r.plan_length}</td>
                <td>{r.start_date ? new Date(r.start_date).toLocaleDateString('en-IN') : '-'}</td>
                <td><span className={`chip ${r.active ? chip[r.status] : 'alert'}`}>{r.active ? r.status : 'login off'}</span></td>
                <td className="small">{r.last_login ? new Date(r.last_login).toLocaleDateString('en-IN') : 'Never'}</td>
                <td className="small">{r.last_checkin ? new Date(r.last_checkin).toLocaleDateString('en-IN') : 'None yet'}</td>
                <td><Link href={`/clients/${r.id}`} className="btn sm">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
