import Link from 'next/link';
import { q } from '@/lib/db';
import { aiReady } from '@/lib/ai';
import BriefingCard from '@/components/BriefingCard';

export default async function Dashboard() {
  const [c] = await q<any>(`SELECT
    count(*)::int total,
    count(*) FILTER (WHERE status='active')::int active,
    count(*) FILTER (WHERE status='invited')::int invited,
    count(*) FILTER (WHERE status='finished')::int finished,
    count(*) FILTER (WHERE plan_length='quarterly')::int quarterly FROM clients`);
  const quiet = await q<any>(`SELECT cl.id, u.name, max(ch.created_at) last FROM clients cl JOIN users u ON u.id=cl.user_id
    LEFT JOIN checkins ch ON ch.client_id=cl.id WHERE cl.status='active'
    GROUP BY cl.id, u.name HAVING max(ch.created_at) IS NULL OR max(ch.created_at) < now() - interval '8 days' ORDER BY u.name`);
  const renew = await q<any>(`SELECT cl.id, u.name, cl.plan_length, cl.start_date FROM clients cl JOIN users u ON u.id=cl.user_id
    WHERE cl.status='active' AND cl.start_date IS NOT NULL AND
    cl.start_date + (CASE WHEN cl.plan_length='quarterly' THEN 84 ELSE 28 END) <= current_date + 7 ORDER BY cl.start_date`);
  const pain = await q<any>(`SELECT u.name, cl.id, ch.leg, ch.back, ch.pelvic, ch.created_at FROM checkins ch
    JOIN clients cl ON cl.id=ch.client_id JOIN users u ON u.id=cl.user_id
    WHERE ch.created_at > now() - interval '14 days' AND (coalesce(ch.leg,0)>=5 OR coalesce(ch.back,0)>=5 OR coalesce(ch.pelvic,0)>=7) ORDER BY ch.created_at DESC LIMIT 8`);
  const progress = await q<any>(`SELECT cl.id, u.name,
      (SELECT count(*) FROM completions co WHERE co.client_id=cl.id)::int done,
      (SELECT coalesce(sum(jsonb_array_length(d->'items')),0) FROM plans p, jsonb_array_elements(p.data->'days') d WHERE p.client_id=cl.id)::int total
      FROM clients cl JOIN users u ON u.id=cl.user_id WHERE cl.status='active' ORDER BY u.name`);
  const sends = await q<any>(`SELECT s.channel, s.subject, s.created_at, u.name FROM sends s LEFT JOIN clients cl ON cl.id=s.client_id LEFT JOIN users u ON u.id=cl.user_id ORDER BY s.created_at DESC LIMIT 6`);
  return (
    <>
      <div><h1>Dashboard</h1><p className="muted">Who needs you this week, at a glance.</p></div>
      <BriefingCard aiReady={aiReady()} />
      <div className="grid">
        <div className="stat"><span>Clients</span><b>{c.total}</b></div>
        <div className="stat"><span>Active</span><b>{c.active}</b></div>
        <div className="stat"><span>Invited</span><b>{c.invited}</b></div>
        <div className="stat"><span>Quarterly</span><b>{c.quarterly}</b></div>
      </div>
      <div className="row" style={{ alignItems: 'stretch' }}>
        <section className="card" style={{ flex: '1 1 340px' }}>
          <h3>No check-in for 8 days</h3>
          {quiet.length === 0 ? <p className="muted">Everyone is up to date.</p> : quiet.map((r: any) => (
            <div key={r.id} className="row between"><Link href={`/clients/${r.id}`}>{r.name}</Link><span className="small muted">{r.last ? new Date(r.last).toLocaleDateString('en-IN') : 'Never'}</span></div>
          ))}
        </section>
        <section className="card" style={{ flex: '1 1 340px' }}>
          <h3>Renewals due within a week</h3>
          {renew.length === 0 ? <p className="muted">No renewals due.</p> : renew.map((r: any) => (
            <div key={r.id} className="row between"><Link href={`/clients/${r.id}`}>{r.name}</Link><span className="chip warn">{r.plan_length}</span></div>
          ))}
        </section>
        <section className="card" style={{ flex: '1 1 340px' }}>
          <h3>Symptoms to look at</h3>
          {pain.length === 0 ? <p className="muted">No high scores in the last 14 days.</p> : pain.map((r: any, i: number) => (
            <div key={i} className="row between"><Link href={`/clients/${r.id}`}>{r.name}</Link><span className="small">Leg {r.leg ?? '-'} · Back {r.back ?? '-'} · Pelvic {r.pelvic ?? '-'}</span></div>
          ))}
        </section>
      </div>
      <div className="row" style={{ alignItems: 'stretch' }}>
        <section className="card" style={{ flex: '1 1 420px' }}>
          <h3>Plan progress (exercises ticked)</h3>
          {progress.length === 0 ? <p className="muted">Active clients appear here.</p> : progress.map((r: any) => {
            const pct = r.total ? Math.min(100, Math.round((r.done / r.total) * 100)) : 0;
            return (
              <div key={r.id}>
                <div className="row between small"><Link href={`/clients/${r.id}`}>{r.name}</Link><span className="muted">{r.done} of {r.total}</span></div>
                <div className="bar"><i style={{ width: pct + '%' }} /></div>
              </div>
            );
          })}
        </section>
        <section className="card" style={{ flex: '1 1 340px' }}>
          <h3>Recently sent</h3>
          {sends.length === 0 ? <p className="muted">Nothing sent yet.</p> : sends.map((r: any, i: number) => (
            <div key={i} className="row between small"><span>{r.subject || 'Message'} · {r.name || 'Group'}</span><span className="chip ok">{r.channel}</span></div>
          ))}
        </section>
      </div>
    </>
  );
}
