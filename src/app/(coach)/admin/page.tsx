import Link from 'next/link';
import { q } from '@/lib/db';
import { ImportBox, MyPassword, ResetButton } from '@/components/AdminTools';

export default async function Admin() {
  const users = await q<any>(`SELECT u.id, u.name, u.email, u.role, u.active, u.must_change, u.last_login, cl.id client_id FROM users u LEFT JOIN clients cl ON cl.user_id=u.id ORDER BY u.role, u.name`);
  const [n] = await q<any>(`SELECT (SELECT count(*) FROM clients)::int clients, (SELECT count(*) FROM plans)::int plans, (SELECT count(*) FROM checkins)::int checkins, (SELECT count(*) FROM sends)::int sends`);
  return (
    <>
      <div><h1>Admin</h1><p className="muted">Manage logins, back up everything, and move data in and out.</p></div>
      <div className="grid">
        <div className="stat"><span>Clients</span><b>{n.clients}</b></div>
        <div className="stat"><span>Plans</span><b>{n.plans}</b></div>
        <div className="stat"><span>Check-ins</span><b>{n.checkins}</b></div>
        <div className="stat"><span>Messages sent</span><b>{n.sends}</b></div>
      </div>
      <div className="row" style={{ alignItems: 'stretch' }}>
        <section className="card" style={{ flex: '1 1 360px' }}>
          <h3>Export and backup</h3>
          <p className="small muted">The backup holds every client, plan and check-in. It does not include passwords. Keep it somewhere private, because it contains health notes.</p>
          <div className="row">
            <a className="btn primary" href="/api/export/json" download>Download full backup (.json)</a>
            <a className="btn" href="/api/export/clients" download>Clients sheet (.csv)</a>
          </div>
        </section>
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 16 }}><ImportBox /></div>
      </div>
      <section className="card">
        <h3>All logins</h3>
        <div className="tablewrap"><table>
          <thead><tr><th>Name</th><th>Email (username)</th><th>Role</th><th>State</th><th>Last login</th><th></th></tr></thead>
          <tbody>{users.map((u: any) => (
            <tr key={u.id}>
              <td style={{ fontWeight: 700 }}>{u.client_id ? <Link href={`/clients/${u.client_id}`}>{u.name}</Link> : u.name}</td>
              <td>{u.email}</td><td style={{ textTransform: 'capitalize' }}>{u.role}</td>
              <td><span className={`chip ${!u.active ? 'alert' : u.must_change ? 'warn' : 'ok'}`}>{!u.active ? 'Off' : u.must_change ? 'Temporary password' : 'Active'}</span></td>
              <td className="small">{u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}</td>
              <td>{u.role === 'client' && <ResetButton userId={u.id} />}</td>
            </tr>))}</tbody>
        </table></div>
        <p className="small muted">Passwords are stored scrambled and nobody, including you, can read them. Reset gives a new temporary password to share.</p>
      </section>
      <div style={{ maxWidth: 480 }}><MyPassword /></div>
    </>
  );
}
