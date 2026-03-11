'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlayCircle, WalletCards, KeyRound, Logs, Bell, Workflow, Settings, Command as LucideCommand, GitBranch, BarChart3, Bot, BookOpen, ServerCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
    { href: '/', label: 'Overview', icon: Home },
    { href: '/launch', label: 'AI Launch', icon: PlayCircle },
    { href: '/orchestrations', label: 'Orchestrations', icon: GitBranch },
    { href: '/automations', label: 'Automations', icon: Workflow },
    { href: '/ai-usage', label: 'AI Usage', icon: BarChart3 },
    { href: '/agents-map', label: 'Agent Map', icon: Bot },
    { href: '/mcp', label: 'MCP Servers', icon: ServerCog },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/logs', label: 'System Logs', icon: Logs },
    { href: '/skills', label: 'Skills & Tips', icon: BookOpen },
    { href: '/subscriptions', label: 'Subscriptions', icon: WalletCards },
    { href: '/vault', label: 'API Vault', icon: KeyRound },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <aside className={cn("flex flex-col border-r border-line bg-paper h-full", className)}>
            <div className="p-6">
                <div className="flex items-center gap-2 font-serif text-xl font-bold text-ink">
                    <div className="w-8 h-8 bg-ink text-white rounded-lg flex items-center justify-center">
                        <LucideCommand size={18} />
                    </div>
                    AI Control
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2 px-2 mt-4">Platform</div>
                {items.slice(0, 10).map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                active ? "bg-ink text-white shadow-sm" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                            )}
                        >
                            <Icon size={18} className={cn("transition-colors", active ? "text-white" : "text-ink/40 group-hover:text-ink")} />
                            {label}
                        </Link>
                    );
                })}

                <div className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2 px-2 mt-6">Infrastructure</div>
                {items.slice(10).map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                active ? "bg-ink text-white shadow-sm" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                            )}
                        >
                            <Icon size={18} className={cn("transition-colors", active ? "text-white" : "text-ink/40 group-hover:text-ink")} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-line">
                <div className="bg-ink/5 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                    <div className="text-sm">
                        <div className="font-bold text-ink">Operator</div>
                        <div className="text-xs text-ink/40">Online</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
