'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cog, Plus, NotebookPen } from 'lucide-react';

const rules = [
  { test: (p: string) => p === '/', title: 'Home', action: '/settings' },
  { test: (p: string) => p.startsWith('/launch'), title: 'Launch', action: '/launch' },
  { test: (p: string) => p.startsWith('/subscriptions'), title: 'Subscriptions', action: '/subscriptions/new' },
  { test: (p: string) => p.startsWith('/vault'), title: 'Vault', action: '/vault/new' },
  { test: (p: string) => p.startsWith('/logs'), title: 'Logs', action: '/logs' },
  { test: (p: string) => p.startsWith('/settings'), title: 'Settings', action: '/settings' }
];

export function AppHeader() {
  const pathname = usePathname();
  const current = rules.find((item) => item.test(pathname)) ?? rules[0];
  const isSettings = pathname === '/' || pathname.startsWith('/settings');

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur lg:hidden">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-2 text-ink/80"><NotebookPen size={16} /><span className="text-xs uppercase tracking-[0.2em]">AICN</span></div>
        <h1 className="font-serif text-lg">{current.title}</h1>
        <Link href={current.action} className="rounded-full border border-line bg-white/60 p-2">
          {isSettings ? <Cog size={15} /> : <Plus size={15} />}
        </Link>
      </div>
    </header>
  );
}
