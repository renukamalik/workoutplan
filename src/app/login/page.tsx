import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Logo from '@/components/Logo';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const s = await getSession();
  if (s) redirect('/');
  return (
    <div className="login">
      <div className="brand">
        <Logo size={40} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
          <h1>Stronger every week, <em style={{ color: 'var(--accent)' }}>with your coach beside you.</em></h1>
          <p style={{ fontSize: 17, color: '#5E4A56', maxWidth: '44ch' }}>Your plan, your videos, your weekly check-ins and your live session details, all in one private place.</p>
        </div>
        <p className="small" style={{ color: '#5E4A56' }}>Coach Renuka</p>
      </div>
      <div className="form"><LoginForm /></div>
    </div>
  );
}
