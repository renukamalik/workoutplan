import { requireAdmin } from '@/lib/auth';
import { headers } from 'next/headers';
import CoachShell from '@/components/CoachShell';

export const dynamic = 'force-dynamic';

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAdmin();
  const path = (await headers()).get('x-pathname') || '';
  const active = '/' + (path.split('/')[1] || 'dashboard');
  return <CoachShell session={s} active={active}>{children}</CoachShell>;
}
