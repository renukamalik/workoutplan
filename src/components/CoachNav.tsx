'use client';
import Link from 'next/link';
import { LayoutDashboard, Users, Sparkles, ClipboardList, Send, Settings, MoreHorizontal, LogOut } from 'lucide-react';
import Logo from './Logo';
import { Button } from './ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from './ui/sheet';
import { logoutAction } from '@/app/login/actions';
import { cn } from '@/lib/utils';

const main = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/create', label: 'Create', icon: Sparkles },
  { href: '/plans', label: 'Plans', icon: ClipboardList },
];
const more = [
  { href: '/send', label: 'Send plans', icon: Send },
  { href: '/admin', label: 'Admin', icon: Settings },
];
const all = [main[0], main[1], main[2], main[3], ...more];

export default function CoachNav({ name, active }: { name: string; active: string }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="noprint sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-border bg-card p-4 md:flex">
        <Logo />
        <nav className="flex flex-col gap-1" aria-label="Main">
          {all.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-bold no-underline', active === href ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary')}>
              <Icon className="size-[18px]" />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 rounded-xl bg-secondary p-3">
          <div><b>{name}</b><div className="text-xs text-muted-foreground">Coach account</div></div>
          <form action={logoutAction}><Button variant="outline" size="sm" className="w-full">Log out</Button></form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="noprint sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:hidden">
        <Logo size={24} />
        <span className="text-xs font-bold text-muted-foreground">{name.split(' ')[0]}</span>
      </header>

      {/* Mobile bottom tabs */}
      <nav aria-label="Main" className="noprint fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        {main.map(({ href, label, icon: Icon }) => {
          const on = active === href;
          return (
            <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={cn('flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold no-underline', on ? 'text-primary' : 'text-muted-foreground')}>
              <span className={cn('grid h-7 w-12 place-items-center rounded-full', on && 'bg-secondary')}><Icon className="size-5" /></span>{label}
            </Link>
          );
        })}
        <Sheet>
          <SheetTrigger className={cn('flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold', more.some((m) => m.href === active) ? 'text-primary' : 'text-muted-foreground')}>
            <span className="grid h-7 w-12 place-items-center rounded-full"><MoreHorizontal className="size-5" /></span>More
          </SheetTrigger>
          <SheetContent side="bottom" className="p-5 pt-6">
            <SheetTitle className="text-lg font-bold">More</SheetTitle>
            <div className="flex flex-col gap-2">
              {more.map(({ href, label, icon: Icon }) => (
                <SheetClose asChild key={href}>
                  <Link href={href} className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 font-bold text-foreground no-underline hover:bg-secondary"><Icon className="size-5 text-primary" />{label}</Link>
                </SheetClose>
              ))}
              <form action={logoutAction}><Button variant="outline" className="w-full justify-start gap-3 px-4"><LogOut className="size-5" />Log out</Button></form>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
