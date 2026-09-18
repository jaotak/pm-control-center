"use client";

import { useState, useEffect } from "react";
import { X, Search, Check, Save, Settings2, ShieldAlert } from "lucide-react";
import { getChatUsers, updateGroupChat, ChatUserSummary, ChatRoomSummary } from "@/app/actions/chat";

type GroupSettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    room: ChatRoomSummary;
    onUpdated: () => void;
};

// Simple in-memory cache to avoid re-fetching on every modal open
let cachedUsers: ChatUserSummary[] | null = null;

export default function GroupSettingsModal({ isOpen, onClose, room, onUpdated }: GroupSettingsModalProps) {
    const [name, setName] = useState(room.name || "");
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<ChatUserSummary[]>(cachedUsers || []);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
        room.members.map((m: { userId: string }) => m.userId)
    );
    const [isLoading, setIsLoading] = useState(!cachedUsers);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Sync state when room changes (in case modal stays mounted)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(room.name || "");
         
        setSelectedUserIds(room.members.map((m: { userId: string }) => m.userId));
    }, [room]);

    useEffect(() => {
        if (!isOpen) return;

        if (cachedUsers) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUsers(cachedUsers);
             
            setIsLoading(false);
        } else {
             
            setIsLoading(true);
        }

        getChatUsers()
            .then((res) => {
                if (res.users) {
                    cachedUsers = res.users;
                    setUsers(res.users);
                }
            })
            .catch(() => {
                if (!cachedUsers) setErrorMsg("ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
            })
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredUsers = users.filter((u) => {
        const query = search.toLowerCase();
        return u.name.toLowerCase().includes(query) || (u.email && u.email.toLowerCase().includes(query));
    });

    const toggleSelectUser = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleSubmit = async () => {
        const trimmed = name.trim();
        if (selectedUserIds.length < 2) {
            setErrorMsg("ต้องเลือกสมาชิกอย่างน้อย 2 คนรวมตัวคุณเอง");
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await updateGroupChat(room.id, trimmed, selectedUserIds);
            if (res.success) {
                onUpdated();
                onClose();
            } else {
                setErrorMsg(res.error || "ไม่สามารถอัปเดตกลุ่มแชทได้");
            }
        } catch {
            setErrorMsg("เกิดข้อผิดพลาดในการอัปเดตกลุ่มแชท");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleBadge = (role: string) => {
        if (role === "ADMIN") return "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60";
        if (role === "PM") return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60";
        return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-800 dark:from-slate-700 dark:to-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-500/20">
                            <Settings2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                ตั้งค่าแชทกลุ่ม
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                เปลี่ยนชื่อกลุ่ม และจัดการสมาชิก
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar bg-white dark:bg-slate-900">
                    {/* Error Message */}
                    {errorMsg && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-xl flex gap-2 items-start">
                            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {/* Group Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                            ชื่อกลุ่มแชท
                        </label>
                        <input
                            type="text"
                            placeholder="ปล่อยว่างเพื่อใช้ชื่ออัตโนมัติ"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                    </div>

                    {/* User Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                สมาชิกในกลุ่ม ({selectedUserIds.length} คน)
                            </label>
                        </div>
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="ค้นหารายชื่อเพื่อนร่วมงาน..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-[220px] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800/50">
                            {isLoading ? (
                                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                    กำลังโหลดรายชื่อ...
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                    ไม่พบรายชื่อ
                                </div>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleSelectUser(user.id)}
                                            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isSelected
                                                    ? "bg-emerald-50/80 dark:bg-emerald-900/20"
                                                    : "hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-white">
                                                    {user.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                                                        {user.name}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadge(user.role)}`}>
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected
                                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                                        : "border-slate-300 dark:border-slate-600 text-transparent"
                                                    }`}
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || isLoading}
                        className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <Save size={16} /> บันทึก
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
