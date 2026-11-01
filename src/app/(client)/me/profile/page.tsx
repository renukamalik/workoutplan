import { q } from '@/lib/db';
import { requireClient } from '@/lib/auth';
import ProfileForm from './ProfileForm';

export default async function Profile() {
  const c = await requireClient();
  const [p] = await q<any>(`SELECT u.name, u.phone, cl.* FROM clients cl JOIN users u ON u.id=cl.user_id WHERE cl.id=$1`, [c.clientId]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div><h1>My profile</h1><p className="muted">Your coach sees what you fill in here, and nobody else does.</p></div>
      <ProfileForm p={p} />
    </div>
  );
}
