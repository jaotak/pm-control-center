"use client";

import { Search, LogOut, Shield, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import NotificationBell from './NotificationBell';
import GlobalSearchModal from './GlobalSearchModal';
import { getUnreadNotifications } from '@/app/actions/notification';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from '@/app/context/SidebarContext';

export default function Topbar() {
    const { data: session } = useSession();
    const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { toggleSidebar } = useSidebar();

    const userId = (session?.user as any)?.id;

    useEffect(() => {
        if (userId) {
            getUnreadNotifications(userId).then((data) => {
                setUnreadNotifications(data);
            });
        }
    }, [userId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const initial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U";
    const role = (session?.user as any)?.role || "USER";

    const getRoleStyle = (roleName: string) => {
        if (roleName === 'ADMIN') return 'bg-rose-50 text-rose-700 border-rose-200/80';
        if (roleName === 'PM') return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    };

    return (
        <>
            <header className="h-16 glass-panel border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 shrink-0 z-40 relative sticky top-0 shadow-sm gap-2 md:gap-4">

                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <button 
                        onClick={toggleSidebar}
                        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors shrink-0"
                    >
                        <Menu size={22} />
                    </button>

                    {/* Quick Search Trigger Pill */}
                    <div
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center bg-slate-100/90 hover:bg-slate-200/80 cursor-pointer px-3 md:px-3.5 py-2 rounded-xl w-full md:w-96 transition-all border border-slate-200/60 hover:border-slate-300 group min-w-0"
                    >
                        <Search size={17} className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                        <span className="ml-2.5 text-sm text-slate-500 font-normal truncate">ค้นหาด่วน...</span>
                        <kbd className="ml-auto hidden md:inline-flex items-center text-[10px] font-bold bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded-md shadow-2xs group-hover:border-slate-300 shrink-0">
                            Ctrl+K
                        </kbd>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                    {/* User Role Badge */}
                    <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs ${getRoleStyle(role)}`}>
                        <Shield size={14} className="opacity-80" />
                        <span>Role: {role}</span>
                    </div>

                    {/* Notification Bell Dropdown */}
                    <NotificationBell initialNotifications={unreadNotifications} />

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Profile Section */}
                    <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20 ring-2 ring-white overflow-hidden">
                            {(session?.user as any)?.avatarUrl ? (
                                <img src={(session?.user as any)?.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                initial
                            )}
                        </div>
                        <div className="hidden md:block">
                            <div className="text-sm font-semibold text-slate-800 leading-tight">{session?.user?.name || 'User'}</div>
                        </div>

                        {/* Sign Out Button */}
                        <button
                            onClick={() => signOut()}
                            className="ml-1 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                            title="ออกจากระบบ"
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </header>

            <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}