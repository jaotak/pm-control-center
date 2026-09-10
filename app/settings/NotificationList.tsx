"use client";

import { useState, useTransition } from "react";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notification";
import { CheckCircle2, Bell, ExternalLink, Clock, CheckCheck } from "lucide-react";
import Link from "next/link";

type Notification = {
    id: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
};

export default function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isPending, startTransition] = useTransition();

    const handleMarkAsRead = (id: string) => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        
        startTransition(async () => {
            await markNotificationAsRead(id);
        });
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        startTransition(async () => {
            await markAllNotificationsAsRead();
        });
    };

    const hasUnread = notifications.some(n => !n.isRead);

    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Bell size={32} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-600">ไม่มีการแจ้งเตือนใหม่</h3>
                <p className="text-xs text-slate-400 mt-1">คุณติดตามทุกอย่างได้ครบถ้วนแล้ว เยี่ยมมาก!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {hasUnread && (
                <div className="flex justify-end pb-1">
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={isPending}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 transition-colors flex items-center gap-1.5"
                    >
                        <CheckCheck size={14} />
                        <span>ทำเป็นอ่านแล้วทั้งหมด</span>
                    </button>
                </div>
            )}
            {notifications.map(notification => (
                <div 
                    key={notification.id} 
                    className={`p-4 border rounded-2xl flex items-start justify-between gap-4 transition-all ${
                        notification.isRead 
                            ? "bg-slate-50 border-slate-100 opacity-70" 
                            : "bg-white border-emerald-100 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-50"
                    }`}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {!notification.isRead && (
                                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 shadow-xs shadow-emerald-500/40 animate-pulse"></span>
                            )}
                            <h3 className={`text-sm font-bold truncate ${notification.isRead ? "text-slate-600" : "text-slate-800"}`}>
                                {notification.title}
                            </h3>
                        </div>
                        <p className={`text-xs mt-0.5 leading-relaxed ${notification.isRead ? "text-slate-500" : "text-slate-600"}`}>
                            {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-md">
                                <Clock size={10} />
                                {new Date(notification.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            {notification.link && (
                                <Link 
                                    href={notification.link}
                                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                                >
                                    ดูรายละเอียด <ExternalLink size={12} />
                                </Link>
                            )}
                        </div>
                    </div>
                    
                    {!notification.isRead && (
                        <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                            className="p-1.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all shrink-0"
                        >
                            <CheckCircle2 size={18} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
