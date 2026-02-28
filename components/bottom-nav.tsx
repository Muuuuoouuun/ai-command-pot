'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlayCircle, WalletCards, KeyRound, Logs } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/launch', label: 'Launch', icon: PlayCircle },
  { href: '/subscriptions', label: 'Subscriptions', icon: WalletCards },
  { href: '/vault', label: 'Vault', icon: KeyRound },
  { href: '/logs', label: 'Logs', icon: Logs }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-paper/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-xl py-1 text-xs ${active ? 'text-ink bg-[#efe6d8]' : 'text-ink/65'}`}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
