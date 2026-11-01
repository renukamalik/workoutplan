import Link from 'next/link';
import { headers } from 'next/headers';
import { requireClient } from '@/lib/auth';
import { Dumbbell, ClipboardCheck, UserRound } from 'lucide-react';
import Logo from '@/components/Logo';
import { logoutAction } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const s = await requireClient();
  const path = (await headers()).get('x-pathname') || '';
  const tabs = [{ href: '/me', label: 'My plan', Icon: Dumbbell }, { href: '/me/checkin', label: 'Check-in', Icon: ClipboardCheck }, { href: '/me/profile', label: 'Profile', Icon: UserRound }];
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="row between" style={{ padding: '14px 16px' }}>
        <Logo size={26} />
        <form action={logoutAction}><button className="btn sm">Log out</button></form>
      </div>
      <div style={{ flex: 1, padding: '0 16px 100px' }}>{children}</div>
      <nav aria-label="Client" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: 760 }}>
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={path === t.href ? 'page' : undefined} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 4px', minHeight: 60, fontWeight: 700, fontSize: 12, textDecoration: 'none', color: path === t.href ? 'var(--accent)' : 'var(--muted)' }}>
              <t.Icon size={22} />{t.label}
            </Link>
          ))}
        </div>
      </nav>
      <span hidden>{s.uid}</span>
    </div>
  );
}
