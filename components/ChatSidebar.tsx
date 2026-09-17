"use client";

import React, { useState, useRef } from "react";
import { Search, Plus, MessageSquare, Users, Trash2, X } from "lucide-react";
import { ChatRoomSummary } from "@/app/actions/chat";
import NewChatModal from "./NewChatModal";

interface ChatSidebarProps {
    rooms: ChatRoomSummary[];
    selectedRoomId: string | null;
    onSelectRoom: (roomId: string) => void;
    onRoomCreated: (roomId: string) => void;
    onDeleteRoom?: (roomId: string) => void;
    currentUserId: string;
}

function formatChatTime(dateInput: Date | string | undefined) {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        return "เมื่อวาน";
    }

    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export default function ChatSidebar({
    rooms,
    selectedRoomId,
    onSelectRoom,
    onRoomCreated,
    onDeleteRoom,
    currentUserId,
}: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredRooms = rooms.filter((room) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        if (room.displayName.toLowerCase().includes(q)) return true;
        if (room.lastMessage?.body.toLowerCase().includes(q)) return true;
        return false;
    });

    const totalUnread = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);

    const handleDeleteClick = (e: React.MouseEvent, roomId: string) => {
        e.stopPropagation();
        setConfirmDeleteId(roomId);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId || !onDeleteRoom) return;
        setDeletingId(confirmDeleteId);
        onDeleteRoom(confirmDeleteId);
        setConfirmDeleteId(null);
        // deletingId will be cleared when room disappears from list
        setTimeout(() => setDeletingId(null), 2000);
    };

    const confirmRoom = confirmDeleteId ? rooms.find((r) => r.id === confirmDeleteId) : null;

    return (
        <aside className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 shrink-0">
            {/* Top Header */}
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-600 flex items-center justify-center text-white shadow-xs">
                        <MessageSquare size={17} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span>ข้อความ</span>
                            {totalUnread > 0 && (
                                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white pulse-badge">
                                    {totalUnread}
                                </span>
                            )}
                        </h2>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold"
                    title="เริ่มแชทใหม่"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">แชทใหม่</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาบทสนทนา..."
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                </div>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredRooms.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                            <MessageSquare size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {searchQuery ? "ไม่พบบทสนทนาที่ค้นหา" : "ยังไม่มีบทสนทนา"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                            กดปุ่ม &quot;แชทใหม่&quot; ด้านบนเพื่อเริ่มคุยกับเพื่อนร่วมงาน
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all"
                        >
                            เริ่มสนทนาใหม่
                        </button>
                    </div>
                ) : (
                    filteredRooms.map((room) => {
                        const isSelected = room.id === selectedRoomId;
                        const lastMsg = room.lastMessage;
                        const isMyMessage = lastMsg?.senderId === currentUserId;
                        const isDeleting = room.id === deletingId;

                        return (
                            <div
                                key={room.id}
                                className={`relative group rounded-2xl transition-all ${
                                    isDeleting ? "opacity-40 scale-95 pointer-events-none" : ""
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => onSelectRoom(room.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                                        isSelected
                                            ? "bg-gradient-to-r from-emerald-500/15 to-green-500/10 dark:from-emerald-900/40 dark:to-green-900/30 border border-emerald-200/80 dark:border-emerald-700/50 shadow-xs"
                                            : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent"
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        {room.type === "group" ? (
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
                                                <Users size={19} />
                                            </div>
                                        ) : room.displayAvatar ? (
                                            <img
                                                src={room.displayAvatar}
                                                alt={room.displayName}
                                                className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                                                {room.displayName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {room.type === "group" && (
                                            <span className="absolute -bottom-1 -right-1 text-[9px] bg-slate-800 text-white px-1 py-0.2 rounded-md font-bold">
                                                {room.members.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <h4
                                                className={`text-sm font-semibold truncate ${
                                                    isSelected
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                                                }`}
                                            >
                                                {room.displayName}
                                            </h4>
                                            <span className="text-[11px] text-slate-400 shrink-0">
                                                {formatChatTime(lastMsg?.createdAt || room.updatedAt)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <p
                                                className={`text-xs truncate ${
                                                    room.unreadCount > 0
                                                        ? "font-semibold text-slate-900 dark:text-slate-100"
                                                        : "text-slate-500 dark:text-slate-400"
                                                }`}
                                            >
                                                {lastMsg ? (
                                                    <>
                                                        {isMyMessage ? (
                                                            <span className="text-slate-400">คุณ: </span>
                                                        ) : room.type === "group" ? (
                                                            <span className="text-slate-400">
                                                                {lastMsg.senderName}:{" "}
                                                            </span>
                                                        ) : null}
                                                        {lastMsg.body}
                                                    </>
                                                ) : (
                                                    <span className="italic text-slate-400">
                                                        ยังไม่มีข้อความ
                                                    </span>
                                                )}
                                            </p>

                                            {room.unreadCount > 0 && (
                                                <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shrink-0">
                                                    {room.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {/* Delete Button — visible on hover */}
                                {onDeleteRoom && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteClick(e, room.id)}
                                        className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200 shadow-xs z-10"
                                        title="ลบบทสนทนา"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && confirmRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                        {/* Warning Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                                <Trash2 size={28} className="text-red-500" />
                            </div>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-1">
                            ลบบทสนทนา
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1">
                            คุณต้องการลบบทสนทนากับ
                        </p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center mb-4">
                            &quot;{confirmRoom.displayName}&quot;
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400 text-center mb-5 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2">
                            ⚠️ ข้อความทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                            >
                                <Trash2 size={15} />
                                <span>ลบเลย</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Chat Modal */}
            <NewChatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRoomCreated={(roomId) => {
                    onRoomCreated(roomId);
                    onSelectRoom(roomId);
                }}
            />
        </aside>
    );
}
