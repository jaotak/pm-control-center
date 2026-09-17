/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Users, Clock, CheckCheck, Check } from "lucide-react";
import { ChatRoomSummary } from "@/app/actions/chat";
import ChatInput from "./ChatInput";

export interface ChatMessageItem {
    id: string;
    body: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentType?: string | null;
    attachmentSize?: number | null;
    senderId: string;
    createdAt: Date | string;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
        email: string;
        role: string;
    };
}

interface ChatWindowProps {
    room: ChatRoomSummary | null;
    messages: ChatMessageItem[];
    currentUserId: string;
    isLoadingMessages: boolean;
    isAiTyping?: boolean;
    onSendMessage: (body: string, attachment?: { url: string; name: string; type: string; size: number }) => Promise<boolean | void>;
    onBack?: () => void;
}

function formatMessageTime(dateInput: Date | string) {
    const date = new Date(dateInput);
    return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(dateInput: Date | string) {
    const date = new Date(dateInput);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) return "วันนี้";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "เมื่อวาน";

    return date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function ChatWindow({
    room,
    messages,
    currentUserId,
    isLoadingMessages,
    isAiTyping = false,
    onSendMessage,
    onBack,
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showMemberDetails, setShowMemberDetails] = useState(false);

    // Auto scroll to bottom when messages or typing state update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isAiTyping]);

    if (!room) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-950/40">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-inner">
                    <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    เลือกบทสนทนาเพื่อเริ่มแชท
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    เลือกห้องสนทนาจากแถบด้านซ้าย หรือกดปุ่ม &quot;แชทใหม่&quot; เพื่อส่งข้อความหาเพื่อนร่วมงาน
                </p>
            </div>
        );
    }

    const otherMembers = room.members.filter((m) => m.userId !== currentUserId);

    return (
        <section className="flex-1 flex flex-col h-full bg-slate-50/30 dark:bg-slate-950/30 overflow-hidden relative">
            {/* Header */}
            <header className="h-16 px-4 sm:px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 -ml-1"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {room.type === "group" ? (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
                                <Users size={18} />
                            </div>
                        ) : room.displayAvatar ? (
                            <img
                                src={room.displayAvatar}
                                alt={room.displayName}
                                className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                                {room.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Room Meta */}
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {room.displayName}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
                            {room.type === "group" ? (
                                <button
                                    type="button"
                                    onClick={() => setShowMemberDetails((prev) => !prev)}
                                    className="hover:underline flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"
                                >
                                    <span>{room.members.length} สมาชิก</span>
                                    <span>• ดูรายชื่อ</span>
                                </button>
                            ) : otherMembers.length > 0 ? (
                                <span>
                                    {otherMembers[0].user.department || otherMembers[0].user.role || otherMembers[0].user.email}
                                </span>
                            ) : (
                                <span>สนทนากับตนเอง</span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Group Members Popover Dropdown */}
            {showMemberDetails && room.type === "group" && (
                <div className="absolute top-16 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            สมาชิกทั้งหมด ({room.members.length})
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowMemberDetails(false)}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            ปิด
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar">
                        {room.members.map((m) => (
                            <div key={m.userId} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                {m.user.avatarUrl ? (
                                    <img src={m.user.avatarUrl} alt={m.user.name} className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-[10px]">
                                        {m.user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                                        {m.user.name} {m.userId === currentUserId && "(คุณ)"}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                        {m.user.department || m.user.role}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                {isLoadingMessages ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        กำลังโหลดข้อความ...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                            <Clock size={20} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            เริ่มต้นการสนทนา
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            พิมพ์ข้อความด้านล่างเพื่อเริ่มพูดคุยกันได้เลย
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === currentUserId;
                        const prevMsg = messages[index - 1];

                        // Determine if date header is required
                        const showDateHeader =
                            !prevMsg ||
                            new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                        // Determine if message is read by anyone else
                        const isReadBySomeone = otherMembers.some(m => new Date(m.lastReadAt) >= new Date(msg.createdAt));

                        return (
                            <React.Fragment key={msg.id}>
                                {showDateHeader && (
                                    <div className="flex items-center justify-center my-3">
                                        <span className="px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shadow-2xs">
                                            {formatDateHeader(msg.createdAt)}
                                        </span>
                                    </div>
                                )}

                                <div className={`flex gap-2.5 items-end ${isMe ? "justify-end" : "justify-start"}`}>
                                    {/* Sender Avatar for others */}
                                    {!isMe && (
                                        <div className="shrink-0 mb-1">
                                            {msg.sender.avatarUrl ? (
                                                <img
                                                    src={msg.sender.avatarUrl}
                                                    alt={msg.sender.name}
                                                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                                                    {msg.sender.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Message Bubble + Meta */}
                                    <div className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        {/* Sender Name for group chats */}
                                        {!isMe && room.type === "group" && (
                                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">
                                                {msg.sender.name}
                                            </span>
                                        )}

                                        {/* Attachment */}
                                        {msg.attachmentUrl && (
                                            <div className={`mb-1.5 overflow-hidden ${isMe ? "rounded-l-2xl rounded-tr-2xl rounded-br-xs" : "rounded-r-2xl rounded-tl-2xl rounded-bl-xs"} border border-slate-200/80 dark:border-slate-700/60 shadow-2xs`}>
                                                {msg.attachmentType?.startsWith("image/") ? (
                                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="block max-w-xs hover:opacity-90 transition-opacity bg-slate-100 dark:bg-slate-800">
                                                        <img src={msg.attachmentUrl} alt={msg.attachmentName || "Attachment"} className="w-full h-auto object-cover max-h-60" />
                                                    </a>
                                                ) : (
                                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" download className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors w-full min-w-[200px]">
                                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 shrink-0">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{msg.attachmentName}</p>
                                                            <p className="text-xs text-slate-500">{(msg.attachmentSize ? msg.attachmentSize / 1024 / 1024 : 0).toFixed(2)} MB</p>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Text Message */}
                                        {msg.body && (
                                            <div
                                                className={`px-4 py-2.5 shadow-2xs leading-relaxed text-sm whitespace-pre-wrap break-words ${
                                                    isMe
                                                        ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl rounded-br-xs font-normal"
                                                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl rounded-bl-xs"
                                                }`}
                                            >
                                                {msg.body}
                                            </div>
                                        )}

                                        {/* Timestamp & read mark */}
                                        <div
                                            className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1 ${
                                                isMe ? "justify-end" : "justify-start"
                                            }`}
                                        >
                                            <span>{formatMessageTime(msg.createdAt)}</span>
                                            {isMe && (
                                                isReadBySomeone ? (
                                                    <span title="อ่านแล้ว"><CheckCheck size={14} className="text-green-500 drop-shadow-sm" /></span>
                                                ) : (
                                                    <span title="ส่งแล้ว"><Check size={13} className="text-slate-400" /></span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}

                {/* AI Typing Indicator */}
                {isAiTyping && (
                    <div className="flex gap-2.5 items-end justify-start animate-in fade-in duration-200">
                        <div className="shrink-0 mb-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                                AI
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl rounded-bl-xs flex items-center gap-2 shadow-2xs">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-xs text-slate-400 font-medium ml-1">AI กำลังคิดคำตอบ...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <ChatInput onSend={onSendMessage} roomId={room.id} />
        </section>
    );
}
