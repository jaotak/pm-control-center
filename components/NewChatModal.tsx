"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Users, User, Check, Loader2, MessageSquarePlus } from "lucide-react";
import { getChatUsers, createDirectChat, createGroupChat, ChatUserSummary } from "@/app/actions/chat";

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRoomCreated: (roomId: string) => void;
}

export default function NewChatModal({ isOpen, onClose, onRoomCreated }: NewChatModalProps) {
    const [tab, setTab] = useState<"direct" | "group">("direct");
    const [users, setUsers] = useState<ChatUserSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setGroupName("");
            setSelectedUserIds([]);
            setErrorMsg(null);
            return;
        }

        setIsLoading(true);
        getChatUsers()
            .then((res) => {
                if (res.users) {
                    setUsers(res.users);
                }
            })
            .catch(() => setErrorMsg("ไม่สามารถโหลดรายชื่อผู้ใช้ได้"))
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredUsers = users.filter((u) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.department && u.department.toLowerCase().includes(query))
        );
    });

    const handleStartDirect = async (targetUserId: string) => {
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await createDirectChat(targetUserId);
            if (res.roomId) {
                onRoomCreated(res.roomId);
                onClose();
            } else {
                setErrorMsg(res.error || "ไม่สามารถเปิดห้องแชทได้");
            }
        } catch {
            setErrorMsg("เกิดข้อผิดพลาดในการสร้างห้องแชท");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = groupName.trim();
        if (!trimmed) {
            setErrorMsg("กรุณาระบุชื่อกลุ่ม");
            return;
        }
        if (selectedUserIds.length === 0) {
            setErrorMsg("กรุณาเลือกสมาชิกอย่างน้อย 1 คน");
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await createGroupChat(trimmed, selectedUserIds);
            if (res.roomId) {
                onRoomCreated(res.roomId);
                onClose();
            } else {
                setErrorMsg(res.error || "ไม่สามารถสร้างกลุ่มแชทได้");
            }
        } catch {
            setErrorMsg("เกิดข้อผิดพลาดในการสร้างกลุ่มแชท");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelectUser = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                            <MessageSquarePlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                เริ่มบทสนทนาใหม่
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                ส่งข้อความส่วนตัว หรือสร้างกลุ่มสนทนา
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

                {/* Tab Switcher */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 gap-1.5">
                    <button
                        type="button"
                        onClick={() => { setTab("direct"); setErrorMsg(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                            tab === "direct"
                                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <User size={16} />
                        <span>ข้อความส่วนตัว (1:1)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab("group"); setErrorMsg(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                            tab === "group"
                                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <Users size={16} />
                        <span>สร้างกลุ่มใหม่</span>
                    </button>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-medium">
                        {errorMsg}
                    </div>
                )}

                {/* Tab 1: Direct Message */}
                {tab === "direct" && (
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        {/* Search input */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาตามชื่อ อีเมล หรือแผนก..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1 max-h-[360px]">
                            {isLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                                    <span>กำลังโหลดรายชื่อผู้ใช้...</span>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 text-sm">
                                    ไม่พบผู้ใช้งานที่ตรงกับการค้นหา
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => handleStartDirect(user.id)}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {user.name}
                                                </div>
                                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                                    <span>{user.email}</span>
                                                    {user.department && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{user.department}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Tab 2: Group Chat */}
                {tab === "group" && (
                    <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col p-4 overflow-hidden">
                        {/* Group Name input */}
                        <div className="mb-3">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                ชื่อกลุ่ม <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="เช่น ทีม Frontend, Project Apollo..."
                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* Search members */}
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาสมาชิกเพิ่มในกลุ่ม..."
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        <div className="text-xs text-slate-400 mb-1.5 flex justify-between items-center px-1">
                            <span>เลือกสมาชิกเข้าร่วมกลุ่ม</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                เลือกแล้ว {selectedUserIds.length} คน
                            </span>
                        </div>

                        {/* Member checkbox list */}
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1 max-h-[260px] border border-slate-200/80 dark:border-slate-800 rounded-xl p-1.5">
                            {isLoading ? (
                                <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                                    <Loader2 size={20} className="animate-spin text-emerald-500" />
                                    <span>กำลังโหลด...</span>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs">
                                    ไม่พบผู้ใช้งาน
                                </div>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleSelectUser(user.id)}
                                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                                                isSelected
                                                    ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? "bg-emerald-600 border-emerald-600 text-white"
                                                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                                    }`}
                                                >
                                                    {isSelected && <Check size={13} strokeWidth={3} />}
                                                </div>
                                                {user.avatarUrl ? (
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt={user.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-800 dark:text-white">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {user.department || user.role}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !groupName.trim() || selectedUserIds.length === 0}
                                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>กำลังสร้างกลุ่ม...</span>
                                    </>
                                ) : (
                                    <span>สร้างกลุ่ม ({selectedUserIds.length})</span>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
