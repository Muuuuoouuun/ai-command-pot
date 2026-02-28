'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlayCircle, WalletCards, KeyRound, Logs, Bell, Settings, NotebookPen, Workflow } from 'lucide-react';

const mainItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/launch', label: 'Launch', icon: PlayCircle },
    { href: '/subscriptions', label: 'Subscriptions', icon: WalletCards },
    { href: '/vault', label: 'Vault', icon: KeyRound },
    { href: '/logs', label: 'Logs', icon: Logs },
    { href: '/automations', label: 'Automations', icon: Workflow },
];

const bottomItems = [
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function SideNav() {
    const pathname = usePathname();
    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen border-r border-line bg-paper/90 backdrop-blur-md py-6 px-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-3 mb-8">
                <NotebookPen size={17} className="text-ink/70" />
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-ink/80">AICN</span>
            </div>

            {/* Main nav items */}
            <nav className="flex-1 space-y-0.5">
                {mainItems.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                            isActive(href)
                                ? 'bg-ink text-paper font-medium shadow-sm'
                                : 'text-ink/55 hover:text-ink hover:bg-ink/5'
                        }`}
                    >
                        <Icon size={15} />
                        {label}
                    </Link>
                ))}
            </nav>

            {/* Bottom items */}
            <div className="space-y-0.5 border-t border-line/60 pt-4 mt-2">
                {bottomItems.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                            isActive(href)
                                ? 'bg-ink text-paper font-medium shadow-sm'
                                : 'text-ink/55 hover:text-ink hover:bg-ink/5'
                        }`}
                    >
                        <Icon size={15} />
                        {label}
                    </Link>
                ))}
            </div>
        </aside>
    );
}
