import Link from 'next/link';
import Logo from './Logo';
import { logoutAction } from '@/app/login/actions';
import type { Session } from '@/lib/auth';

const items = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/plans', label: 'Plans' },
  { href: '/send', label: 'Send plans' },
  { href: '/admin', label: 'Admin' },
];

export default function CoachShell({ session, active, children }: { session: Session; active: string; children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="side">
        <Logo />
        <nav className="nav" aria-label="Main">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={active === i.href ? 'on' : ''}>{i.label}</Link>
          ))}
        </nav>
        <div className="who">
          <div><b>{session.name}</b><div className="small muted">Coach account</div></div>
          <form action={logoutAction}><button className="btn sm" style={{ width: '100%' }}>Log out</button></form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
