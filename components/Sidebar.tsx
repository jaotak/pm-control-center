"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, CheckSquare, CalendarDays, Settings, ShieldAlert, UserCheck, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/app/context/SidebarContext';
import { fetchBadges, subscribeBadgeUpdates, clearChatUnreadCount, getCachedBadgeData } from '@/lib/badgeService';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
] as const;

function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { isOpen, closeSidebar } = useSidebar();
    const role = (session?.user as any)?.role || "";
    const userEmail = session?.user?.email || "";

    const initialCache = getCachedBadgeData();
    const [pendingCount, setPendingCount] = useState(initialCache?.pendingApprovalsCount || 0);
    const [chatUnreadCount, setChatUnreadCount] = useState(initialCache?.unreadChatCount || 0);

    const isActive = useCallback((href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    }, [pathname]);

    // Handle instant navigation link clicks: avoid redundant state updates & full refetches
    const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (pathname === href) {
            e.preventDefault();
        }
        if (isOpen) {
            closeSidebar();
        }
    }, [pathname, isOpen, closeSidebar]);

    // Fast local route response: zero chat badge immediately when entering /chat without network latency
    useEffect(() => {
        if (pathname === '/chat') {
            clearChatUnreadCount();
            setChatUnreadCount(0);
        }
    }, [pathname]);

    // Synchronize with centralized badge store
    useEffect(() => {
        const unsubscribe = subscribeBadgeUpdates((data) => {
            setChatUnreadCount(data.unreadChatCount);
            setPendingCount(data.pendingApprovalsCount);
        });
        return unsubscribe;
    }, []);

    // Efficient badge fetching (runs on mount, window focus, or 45s interval — NOT on every route change)
    useEffect(() => {
        if (!userEmail) return;

        fetchBadges();

        const handleRefresh = () => {
            if (!document.hidden) fetchBadges();
        };

        document.addEventListener("visibilitychange", handleRefresh);
        window.addEventListener("focus", handleRefresh);
        const interval = setInterval(handleRefresh, 45000);

        return () => {
            document.removeEventListener("visibilitychange", handleRefresh);
            window.removeEventListener("focus", handleRefresh);
            clearInterval(interval);
        };
    }, [userEmail]);

    const isAdmin = role === "ADMIN";
    const isAdminActive = useMemo(() => {
        if (!isAdmin) return false;
        return pathname === '/admin' || (pathname.startsWith('/admin') && !pathname.startsWith('/admin/approvals'));
    }, [isAdmin, pathname]);

    const isApprovalsActive = useMemo(() => {
        if (!isAdmin) return false;
        return pathname.startsWith('/admin/approvals');
    }, [isAdmin, pathname]);

    return (
        <>
            {/* Mobile Backdrop - lightweight, no heavy backdrop blur */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 z-40 md:hidden transition-opacity duration-200"
                    onClick={closeSidebar}
                />
            )}

            <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-[#79985F] text-white/90 flex flex-col min-h-screen shrink-0 border-r border-black/10 shadow-xl z-50 transform-gpu transition-transform duration-200 ease-out md:transition-none ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
                {/* Logo Header */}
                <div className="h-16 flex items-center px-6 border-b border-black/10 bg-transparent">
                    <Link
                        href="/"
                        prefetch={true}
                        onClick={(e) => handleLinkClick(e, '/')}
                        className="flex items-center gap-3 group"
                    >
                        <div>
                            <h1 className="text-base font-bold text-white tracking-tight leading-none group-hover:text-green-200 transition-colors duration-150">
                                Control
                            </h1>
                            <span className="text-[11px] font-semibold text-white/60 tracking-wider uppercase">Center</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-white/60">
                        Main Menu
                    </div>

                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                prefetch={true}
                                onClick={(e) => handleLinkClick(e, item.href)}
                                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 ${active
                                        ? 'bg-black/20 text-white font-semibold shadow-md'
                                        : 'text-white/80 hover:text-white hover:bg-black/10 font-medium'
                                    }`}
                            >
                                <Icon size={19} className={active ? 'text-white' : 'text-white/80 group-hover:text-white transition-colors duration-150'} />
                                <span className="text-sm">{item.name}</span>
                                {item.href === '/chat' && chatUnreadCount > 0 && (
                                    <span className="ml-auto text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center pulse-badge">
                                        {chatUnreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Settings */}
                <div className="p-3 border-t border-black/10 bg-transparent space-y-1">
                    <Link
                        href="/settings"
                        prefetch={true}
                        onClick={(e) => handleLinkClick(e, '/settings')}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 ${isActive('/settings')
                                ? 'bg-black/20 text-white font-semibold shadow-md'
                                : 'text-white/80 hover:text-white hover:bg-black/10 font-medium'
                            }`}
                    >
                        <Settings size={19} className={isActive('/settings') ? 'text-white' : 'text-white/80'} />
                        <span className="text-sm">Settings</span>
                    </Link>
                    {isAdmin && (
                        <>
                            <Link
                                href="/admin/approvals"
                                prefetch={true}
                                onClick={(e) => handleLinkClick(e, '/admin/approvals')}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 ${isApprovalsActive
                                        ? 'bg-amber-500/90 text-white font-semibold shadow-md shadow-amber-500/25'
                                        : 'text-white/80 hover:text-white hover:bg-black/10 font-medium'
                                    }`}
                            >
                                <UserCheck size={19} className={isApprovalsActive ? 'text-white' : 'text-white/80'} />
                                <span className="text-sm">Approvals</span>
                                {pendingCount > 0 && (
                                    <span className="ml-auto text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center pulse-badge">
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>
                            <Link
                                href="/admin"
                                prefetch={true}
                                onClick={(e) => handleLinkClick(e, '/admin')}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 ${isAdminActive
                                        ? 'bg-rose-500/90 text-white font-semibold shadow-md shadow-rose-500/25'
                                        : 'text-white/80 hover:text-white hover:bg-black/10 font-medium'
                                    }`}
                            >
                                <ShieldAlert size={19} className={isAdminActive ? 'text-white' : 'text-white/80'} />
                                <span className="text-sm">Admin Panel</span>
                            </Link>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}

export default React.memo(Sidebar);