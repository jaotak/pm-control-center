"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import { markNotificationAsRead } from "@/app/actions/notification";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Notification = { id: string; title: string; message: string; link: string | null };

export default function NotificationBell({ initialNotifications = [] }: { initialNotifications?: Notification[] }) {
    const { status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [, startTransition] = useTransition();
    const router = useRouter();

    const [liveCount, setLiveCount] = useState(initialNotifications.length);
    const [prevInitial, setPrevInitial] = useState(initialNotifications);

    if (initialNotifications !== prevInitial) {
        setPrevInitial(initialNotifications);
        setNotifications(initialNotifications);
        setLiveCount(initialNotifications.length);
    }

    // SSE — real-time live notification stream
    useEffect(() => {
        if (status !== "authenticated") return;

        const source = new EventSource("/api/notifications/stream");
        source.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLiveCount(data.count);
                setNotifications(data.notifications);
            } catch {
                // parse error — ignore
            }
        };
        source.onerror = () => {
            source.close();
        };
        return () => source.close();
    }, [status]);

    const handleMarkAsRead = (id: string, link: string | null) => {
        startTransition(async () => {
            await markNotificationAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setLiveCount(prev => Math.max(0, prev - 1));
            setIsOpen(false);
            if (link) router.push(link);
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all border border-transparent hover:border-slate-200/60"
                title="การแจ้งเตือน"
            >
                <Bell size={19} />
                {liveCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs pulse-badge">
                        {liveCount > 9 ? '9+' : liveCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2.5 w-[calc(100vw-2.5rem)] sm:w-84 max-w-sm glass-dropdown rounded-2xl shadow-xl z-50 overflow-hidden border border-slate-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                        <div className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <span>การแจ้งเตือน</span>
                            {notifications.length > 0 && (
                                <span className="bg-emerald-100 text-emerald-700 text-[11px] px-2 py-0.5 rounded-full font-bold">
                                    {notifications.length}
                                </span>
                            )}
                        </div>
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
                                        <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                                            {notif.title}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                            {notif.message}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id, null); }}
                                        className="text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                        title="ทำเป็นอ่านแล้ว"
                                    >
                                        <Check size={15} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}