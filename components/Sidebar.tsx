"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, CheckSquare, CalendarDays, Settings, ShieldCheck, ShieldAlert, UserCheck, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSidebar } from '@/app/context/SidebarContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { isOpen, closeSidebar } = useSidebar();
    const role = (session?.user as any)?.role || "";
    const [pendingCount, setPendingCount] = useState(0);
    const [chatUnreadCount, setChatUnreadCount] = useState(0);

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
        { name: 'Calendar', href: '/calendar', icon: CalendarDays },
        { name: 'Chat', href: '/chat', icon: MessageSquare },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    // Fetch pending approval count for admins
    useEffect(() => {
        if (role === "ADMIN") {
            fetch("/api/admin/pending-count")
                .then(res => res.json())
                .then(data => setPendingCount(data.count ?? 0))
                .catch(() => {});
        }
    }, [role, pathname]);

    // Real-time unread chat badge
    useEffect(() => {
        if (!session?.user) return;
        const es = new EventSource("/api/chat/stream");
        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (typeof data.totalUnread === "number") {
                    setChatUnreadCount(data.totalUnread);
                }
            } catch {}
        };
        return () => es.close();
    }, [session?.user]);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={closeSidebar}
                />
            )}
            
            <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-950 text-slate-300 flex flex-col min-h-screen shrink-0 border-r border-slate-800/60 shadow-xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
                {/* Logo Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/50">
                    <Link href="/" onClick={closeSidebar} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <ShieldCheck size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">
                            PM Control
                        </h1>
                        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Center</span>
                    </div>
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Main Menu
                </div>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={closeSidebar}
                            className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                                active
                                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 font-medium'
                            }`}
                        >
                            <Icon size={19} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                            <span className="text-sm">{item.name}</span>
                            {item.href === '/chat' && chatUnreadCount > 0 && (
                                <span className="ml-auto text-[10px] font-extrabold bg-indigo-500 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center pulse-badge">
                                    {chatUnreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Settings */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-1">
                <Link
                    href="/settings"
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive('/settings')
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 font-medium'
                    }`}
                >
                    <Settings size={19} className={isActive('/settings') ? 'text-white' : 'text-slate-400'} />
                    <span className="text-sm">Settings</span>
                </Link>
                {role === "ADMIN" && (
                    <>
                        <Link
                            href="/admin/approvals"
                            onClick={closeSidebar}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                                isActive('/admin/approvals')
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-500/25'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 font-medium'
                            }`}
                        >
                            <UserCheck size={19} className={isActive('/admin/approvals') ? 'text-white' : 'text-slate-400'} />
                            <span className="text-sm">Approvals</span>
                            {pendingCount > 0 && (
                                <span className="ml-auto text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center pulse-badge">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            href="/admin"
                            onClick={closeSidebar}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                                pathname === '/admin' || (isActive('/admin') && !isActive('/admin/approvals'))
                                    ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold shadow-md shadow-rose-500/25'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 font-medium'
                            }`}
                        >
                            <ShieldAlert size={19} className={isActive('/admin') ? 'text-white' : 'text-slate-400'} />
                            <span className="text-sm">Admin Panel</span>
                        </Link>
                    </>
                )}
            </div>
        </aside>
        </>
    );
}