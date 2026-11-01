import { q } from '@/lib/db';
import { requireClient } from '@/lib/auth';
import CheckinForm from './CheckinForm';

export default async function Checkin() {
  const c = await requireClient();
  const past = await q<any>(`SELECT created_at, week FROM checkins WHERE client_id=$1 ORDER BY created_at DESC LIMIT 5`, [c.clientId]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div><h1>Weekly check-in</h1><p className="muted">Fill this in on Sunday. It takes two minutes.</p></div>
      <CheckinForm />
      {past.length > 0 && <p className="small muted">Last sent: {past.map((p: any) => `${new Date(p.created_at).toLocaleDateString('en-IN')}${p.week ? ` (week ${p.week})` : ''}`).join(', ')}</p>}
    </div>
  );
}
