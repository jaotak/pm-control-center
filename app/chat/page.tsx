"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
    getChatRooms,
    getChatMessages,
    sendMessage,
    markAsRead,
    ChatRoomSummary,
} from "@/app/actions/chat";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow, { ChatMessageItem } from "@/components/ChatWindow";

export default function ChatPage() {
    const { data: session } = useSession();
    const currentUserId = (session?.user as any)?.id || "";

    const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [mobileView, setMobileView] = useState<"sidebar" | "window">("sidebar");

    const selectedRoomIdRef = useRef<string | null>(null);
    selectedRoomIdRef.current = selectedRoomId;

    // Load initial rooms
    const fetchRooms = useCallback(async () => {
        const res = await getChatRooms();
        if (res.rooms) {
            setRooms(res.rooms);
            return res.rooms;
        }
        return [];
    }, []);

    useEffect(() => {
        if (!currentUserId) return;
        setIsLoadingRooms(true);
        fetchRooms().then((loadedRooms) => {
            setIsLoadingRooms(false);
            // Default select the first room on desktop if available
            if (loadedRooms.length > 0 && !selectedRoomIdRef.current) {
                if (window.innerWidth >= 768) {
                    setSelectedRoomId(loadedRooms[0].id);
                }
            }
        });
    }, [currentUserId, fetchRooms]);

    // Load messages when selectedRoomId changes
    useEffect(() => {
        if (!selectedRoomId) {
            setMessages([]);
            return;
        }

        setIsLoadingMessages(true);
        getChatMessages(selectedRoomId)
            .then((res) => {
                if (res.messages) {
                    setMessages(res.messages as any);
                }
            })
            .finally(() => setIsLoadingMessages(false));

        // Mark room as read
        markAsRead(selectedRoomId).then(() => {
            setRooms((prev) =>
                prev.map((r) => (r.id === selectedRoomId ? { ...r, unreadCount: 0 } : r))
            );
        });
    }, [selectedRoomId]);

    // Setup SSE stream for real-time updates
    useEffect(() => {
        if (!currentUserId) return;

        const sseUrl = selectedRoomId
            ? `/api/chat/stream?roomId=${encodeURIComponent(selectedRoomId)}`
            : `/api/chat/stream`;

        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // If new messages came in for the currently viewed room
                if (data.newMessages && data.newMessages.length > 0 && data.activeRoomId === selectedRoomIdRef.current) {
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((m) => m.id));
                        const incoming = data.newMessages.filter((m: any) => !existingIds.has(m.id));
                        if (incoming.length === 0) return prev;
                        return [...prev, ...incoming];
                    });

                    // Mark as read immediately since user is actively viewing this room
                    if (selectedRoomIdRef.current) {
                        markAsRead(selectedRoomIdRef.current);
                    }
                }

                // Update unread counts on rooms
                if (data.roomUnreadMap) {
                    setRooms((prev) => {
                        let hasChanged = false;
                        const updated = prev.map((r) => {
                            const newCount = r.id === selectedRoomIdRef.current ? 0 : (data.roomUnreadMap[r.id] ?? 0);
                            if (r.unreadCount !== newCount) {
                                hasChanged = true;
                                return { ...r, unreadCount: newCount };
                            }
                            return r;
                        });
                        return hasChanged ? updated : prev;
                    });
                }
            } catch (err) {
                // Ignore parse errors
            }
        };

        eventSource.onerror = () => {
            // EventSource auto-reconnects
        };

        return () => {
            eventSource.close();
        };
    }, [currentUserId, selectedRoomId]);

    const handleSelectRoom = (roomId: string) => {
        setSelectedRoomId(roomId);
        setMobileView("window");
    };

    const handleRoomCreated = async (roomId: string) => {
        await fetchRooms();
        setSelectedRoomId(roomId);
        setMobileView("window");
    };

    const handleSendMessage = async (body: string, attachment?: { url: string; name: string; type: string; size: number }) => {
        if (!selectedRoomId || !currentUserId) return;

        // Call server action
        const res = await sendMessage(selectedRoomId, body, attachment);
        if (res.error) {
            console.error("Failed to send message:", res.error);
            alert("ไม่สามารถส่งข้อความได้: " + res.error);
            throw new Error(res.error);
        }
        
        if (res.message) {
            const newMsg = res.message as any;
            setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });

            // Update room snippet and sort order in sidebar
            setRooms((prev) => {
                const currentRoom = prev.find((r) => r.id === selectedRoomId);
                if (!currentRoom) return prev;

                const updatedRoom: ChatRoomSummary = {
                    ...currentRoom,
                    updatedAt: new Date(),
                    unreadCount: 0,
                    lastMessage: {
                        id: newMsg.id,
                        body: newMsg.body || (newMsg.attachmentUrl ? "[ไฟล์แนบ]" : ""),
                        senderId: newMsg.senderId,
                        senderName: newMsg.sender.name,
                        createdAt: new Date(newMsg.createdAt),
                    },
                };

                // Move updated room to top
                return [updatedRoom, ...prev.filter((r) => r.id !== selectedRoomId)];
            });
        }
    };

    const currentRoom = rooms.find((r) => r.id === selectedRoomId) || null;

    return (
        <div className="h-[calc(100vh-6.5rem)] flex rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl overflow-hidden relative">
            {/* Sidebar (List of Rooms) */}
            <div
                className={`h-full ${
                    mobileView === "window" ? "hidden md:flex" : "flex w-full md:w-auto"
                }`}
            >
                <ChatSidebar
                    rooms={rooms}
                    selectedRoomId={selectedRoomId}
                    onSelectRoom={handleSelectRoom}
                    onRoomCreated={handleRoomCreated}
                    currentUserId={currentUserId}
                />
            </div>

            {/* Chat Window (Messages + Input) */}
            <div
                className={`h-full flex-1 ${
                    mobileView === "sidebar" ? "hidden md:flex" : "flex"
                }`}
            >
                <ChatWindow
                    room={currentRoom}
                    messages={messages}
                    currentUserId={currentUserId}
                    isLoadingMessages={isLoadingMessages}
                    onSendMessage={handleSendMessage}
                    onBack={() => setMobileView("sidebar")}
                />
            </div>
        </div>
    );
}
