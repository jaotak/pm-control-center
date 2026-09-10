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

                    // Only mark as read if incoming messages were sent by someone else
                    const hasFromOthers = data.newMessages.some((m: any) => m.senderId !== currentUserId);
                    if (hasFromOthers && selectedRoomIdRef.current) {
                        markAsRead(selectedRoomIdRef.current);
                    }
                }

                // Update unread counts, latest messages, and member read statuses on rooms
                if (data.roomUnreadMap || data.roomLatestMessages || data.roomMembersReadStatus) {
                    setRooms((prev) => {
                        let hasChanged = false;
                        const updated = prev.map((r) => {
                            let newCount = r.unreadCount;
                            if (data.roomUnreadMap) {
                                newCount = r.id === selectedRoomIdRef.current ? 0 : (data.roomUnreadMap[r.id] ?? 0);
                            }

                            const latestMsg = data.roomLatestMessages?.[r.id];
                            
                            const changedUnread = r.unreadCount !== newCount;
                            const changedMsg = latestMsg && r.lastMessage?.id !== latestMsg.id;

                            // Update member read statuses for the active room
                            let updatedMembers = r.members;
                            let changedMembers = false;
                            if (data.roomMembersReadStatus && r.id === selectedRoomIdRef.current) {
                                updatedMembers = r.members.map((m) => {
                                    const newReadStr = data.roomMembersReadStatus[m.userId];
                                    if (newReadStr && new Date(newReadStr).getTime() !== new Date(m.lastReadAt).getTime()) {
                                        changedMembers = true;
                                        return { ...m, lastReadAt: new Date(newReadStr) };
                                    }
                                    return m;
                                });
                            }

                            if (changedUnread || changedMsg || changedMembers) {
                                hasChanged = true;
                                return {
                                    ...r,
                                    unreadCount: newCount,
                                    members: updatedMembers,
                                    ...(changedMsg && { lastMessage: latestMsg, updatedAt: new Date(latestMsg.createdAt) }),
                                };
                            }
                            return r;
                        });
                        
                        if (hasChanged) {
                            updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                        }
                        
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

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: any = {
            id: tempId,
            body,
            attachmentUrl: attachment?.url || null,
            attachmentName: attachment?.name || null,
            attachmentType: attachment?.type || null,
            attachmentSize: attachment?.size || null,
            senderId: currentUserId,
            createdAt: new Date(),
            sender: {
                id: currentUserId,
                name: (session?.user as any)?.name || "Me",
                avatarUrl: (session?.user as any)?.avatarUrl || null,
                email: (session?.user as any)?.email || "",
                role: (session?.user as any)?.role || "DEV",
            },
        };

        // 1. Instant UI update (0ms latency for user)
        setMessages((prev) => [...prev, optimisticMsg]);

        // 2. Instant room snippet update in sidebar
        setRooms((prev) => {
            const currentRoom = prev.find((r) => r.id === selectedRoomId);
            if (!currentRoom) return prev;

            const updatedRoom: ChatRoomSummary = {
                ...currentRoom,
                updatedAt: new Date(),
                unreadCount: 0,
                lastMessage: {
                    id: tempId,
                    body: body || (attachment?.url ? "[ไฟล์แนบ]" : ""),
                    senderId: currentUserId,
                    senderName: (session?.user as any)?.name || "Me",
                    createdAt: new Date(),
                },
            };

            return [updatedRoom, ...prev.filter((r) => r.id !== selectedRoomId)];
        });

        // 3. Send message in background
        try {
            const res = await sendMessage(selectedRoomId, body, attachment);
            if (res.error) {
                console.error("Failed to send message:", res.error);
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
                alert("ไม่สามารถส่งข้อความได้: " + res.error);
                return;
            }

            if (res.message) {
                const newMsg = res.message as any;
                setMessages((prev) =>
                    prev.map((m) => (m.id === tempId ? newMsg : m))
                );
            }
        } catch (err: any) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            alert("ไม่สามารถส่งข้อความได้: " + (err?.message || "Error"));
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
