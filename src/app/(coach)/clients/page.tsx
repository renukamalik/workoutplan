import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { q } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const variant: Record<string, 'ok' | 'warn' | 'muted'> = { active: 'ok', invited: 'warn', finished: 'muted' };
const d = (v: any, none: string) => (v ? new Date(v).toLocaleDateString('en-IN') : none);

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const rows = await q<any>(`SELECT cl.id, cl.goal, cl.plan_length, cl.status, cl.start_date, u.name, u.email, u.phone, u.active, u.last_login,
      (SELECT max(created_at) FROM checkins c WHERE c.client_id=cl.id) last_checkin
    FROM clients cl JOIN users u ON u.id=cl.user_id
    WHERE ($1='' OR u.name ILIKE '%'||$1||'%' OR u.email ILIKE '%'||$1||'%' OR u.phone ILIKE '%'||$1||'%')
      AND ($2='' OR cl.status=$2) ORDER BY u.name`, [sp.q || '', sp.status || '']);
  const badge = (r: any) => <Badge variant={r.active ? variant[r.status] || 'muted' : 'alert'}>{r.active ? r.status : 'login off'}</Badge>;
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div><h1>Clients</h1><p className="muted">Add a client, give her a login, and see where she is in her plan.</p></div>
        <Button asChild className="shrink-0"><Link href="/clients/new"><Plus />Add<span className="hidden sm:inline"> client</span></Link></Button>
      </div>
      <form className="flex flex-col gap-2 sm:flex-row" method="get">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input type="search" name="q" defaultValue={sp.q} placeholder="Search name, email or number" aria-label="Search clients" className="pl-9" /></div>
        <select className="in" name="status" defaultValue={sp.status || ''} aria-label="Status">
          <option value="">All statuses</option><option value="active">Active</option><option value="invited">Invited</option><option value="finished">Finished</option>
        </select>
        <Button variant="outline">Filter</Button>
      </form>

      {rows.length === 0 && <Card><p className="muted">No clients yet. Add your first client to begin.</p></Card>}

      {/* Phone: one card per client */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((r: any) => (
          <Link key={r.id} href={`/clients/${r.id}`} className="no-underline">
            <Card className="gap-2 p-4 active:bg-secondary">
              <div className="flex items-start justify-between gap-2"><div><div className="text-base font-bold text-foreground">{r.name}</div><div className="text-sm text-muted-foreground">{r.goal}</div></div>{badge(r)}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="capitalize">{r.plan_length}</span><span>Check-in: {d(r.last_checkin, 'none yet')}</span><span>Login: {d(r.last_login, 'never')}</span></div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Larger screens: table */}
      {rows.length > 0 && (
        <div className="tablewrap hidden md:block">
          <table>
            <thead><tr><th>Client</th><th>Plan</th><th>Start</th><th>Status</th><th>Last login</th><th>Last check-in</th><th></th></tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td><Link href={`/clients/${r.id}`} style={{ fontWeight: 700 }}>{r.name}</Link><div className="small muted">{r.goal}</div></td>
                  <td style={{ textTransform: 'capitalize' }}>{r.plan_length}</td>
                  <td>{d(r.start_date, '-')}</td>
                  <td>{badge(r)}</td>
                  <td className="small">{d(r.last_login, 'Never')}</td>
                  <td className="small">{d(r.last_checkin, 'None yet')}</td>
                  <td><Button asChild size="sm" variant="outline"><Link href={`/clients/${r.id}`}>Open</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
