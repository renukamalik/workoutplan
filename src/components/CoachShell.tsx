import Logo from './Logo';
import CoachNav from './CoachNav';
import type { Session } from '@/lib/auth';

export default function CoachShell({ session, active, children }: { session: Session; active: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <CoachNav name={session.name} active={active} />
      <main className="mx-auto flex w-full min-w-0 max-w-[1280px] flex-1 flex-col gap-5 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-7">{children}</main>
    </div>
  );
}
