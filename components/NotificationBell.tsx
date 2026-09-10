"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Bell, Check, Inbox, CheckCheck, Clock, ExternalLink } from "lucide-react";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notification";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Notification = {
    id: string;
    title: string;
    message: string;
    link: string | null;
    createdAt?: string | Date;
};

function formatTimeAgo(dateStr?: string | Date | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "เมื่อสักครู่";
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
    if (diffDays === 1) return "เมื่อวานนี้";
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

import { fetchBadges, subscribeBadgeUpdates, updateBadgeCache } from "@/lib/badgeService";

export default function NotificationBell({ initialNotifications = [] }: { initialNotifications?: Notification[] }) {
    const { status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [liveCount, setLiveCount] = useState(initialNotifications.length);
    const [, startTransition] = useTransition();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    // Synchronize with centralized badge store
    useEffect(() => {
        const unsubscribe = subscribeBadgeUpdates((data) => {
            if (typeof data.unreadNotificationsCount === "number") {
                setLiveCount(data.unreadNotificationsCount);
            }
            if (Array.isArray(data.unreadNotifications)) {
                setNotifications(data.unreadNotifications);
            }
        });
        return unsubscribe;
    }, []);

    // Efficient polling via shared badgeService (deduplicates with Sidebar)
    useEffect(() => {
        if (status !== "authenticated") return;

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
    }, [status]);

    // Handle click outside to close dropdown
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Immediate optimistic mark as read
    const handleMarkAsRead = (id: string, link: string | null) => {
        // 1. Optimistically update local state immediately
        const remaining = notifications.filter(n => n.id !== id);
        setNotifications(remaining);
        setLiveCount(remaining.length);
        updateBadgeCache({ unreadNotificationsCount: remaining.length, unreadNotifications: remaining });

        if (link) {
            setIsOpen(false);
            router.push(link);
        }

        // 2. Persist in background
        startTransition(async () => {
            try {
                await markNotificationAsRead(id);
            } catch (err) {
                console.error("Failed to mark notification as read:", err);
            }
        });
    };

    // Mark all as read
    const handleMarkAllAsRead = () => {
        // Optimistic clear
        setNotifications([]);
        setLiveCount(0);
        updateBadgeCache({ unreadNotificationsCount: 0, unreadNotifications: [] });

        startTransition(async () => {
            try {
                await markAllNotificationsAsRead();
            } catch (err) {
                console.error("Failed to mark all as read:", err);
            }
        });
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all border border-transparent hover:border-slate-200/60"
                title="การแจ้งเตือน"
                aria-label="การแจ้งเตือน"
            >
                <Bell size={19} />
                {liveCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs pulse-badge">
                        {liveCount > 9 ? '9+' : liveCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2.5 w-[calc(100vw-2.5rem)] sm:w-88 max-w-sm glass-dropdown rounded-2xl shadow-xl z-50 overflow-hidden border border-slate-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                        <div className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <span>การแจ้งเตือน</span>
                            {notifications.length > 0 && (
                                <span className="bg-emerald-100 text-emerald-700 text-[11px] px-2 py-0.5 rounded-full font-bold">
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                title="ทำเป็นอ่านแล้วทั้งหมด"
                            >
                                <CheckCheck size={13} />
                                <span>อ่านทั้งหมด</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-[340px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <div className="py-10 px-6 text-center text-slate-400 flex flex-col items-center gap-2">
                                <Inbox size={36} className="opacity-30 text-emerald-400" />
                                <p className="text-sm font-medium text-slate-600">ไม่มีการแจ้งเตือนใหม่</p>
                                <span className="text-xs text-slate-400">คุณอัปเดตงานครบถ้วนแล้ว 🎉</span>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className="p-3.5 hover:bg-emerald-50/50 transition-colors flex justify-between items-start gap-2.5 group cursor-pointer"
                                    onClick={() => handleMarkAsRead(notif.id, notif.link)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                                                {notif.title}
                                            </div>
                                            {notif.createdAt && (
                                                <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                                                    <Clock size={10} />
                                                    {formatTimeAgo(notif.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                            {notif.message}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(notif.id, null);
                                        }}
                                        className="text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                        title="ทำเป็นอ่านแล้ว"
                                    >
                                        <Check size={15} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer link to view all in settings */}
                    <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
                        <Link
                            href="/settings?tab=notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100"
                        >
                            ดูประวัติการแจ้งเตือนทั้งหมด
                            <ExternalLink size={11} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}