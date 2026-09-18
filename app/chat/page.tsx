/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
    getChatRooms,
    getChatMessages,
    sendMessage,
    markAsRead,
    deleteChatRoom,
    ChatRoomSummary,
} from "@/app/actions/chat";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow, { ChatMessageItem } from "@/components/ChatWindow";

export default function ChatPage() {
    const { data: session } = useSession();
    const currentUserId = (session?.user as { id?: string })?.id || "";

    const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [mobileView, setMobileView] = useState<"sidebar" | "window">("sidebar");

    // Client-side instant message cache: Map<roomId, ChatMessageItem[]>
    const messagesCacheRef = useRef<Map<string, ChatMessageItem[]>>(new Map());
    const selectedRoomIdRef = useRef<string | null>(null);
    useEffect(() => { selectedRoomIdRef.current = selectedRoomId; }, [selectedRoomId]);

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
        fetchRooms().then((loadedRooms) => {
            // Default select the first room on desktop if available
            if (loadedRooms.length > 0 && !selectedRoomIdRef.current) {
                if (window.innerWidth >= 768) {
                    const firstId = loadedRooms[0].id;
                    setSelectedRoomId(firstId);
                }
            }
        });
    }, [currentUserId, fetchRooms]);

    // Instant room switching using Client-Side Cache (Stale-While-Revalidate)
    useEffect(() => {
        if (!selectedRoomId) {
            setMessages([]);
            setIsAiTyping(false);
            return;
        }

        setIsAiTyping(false);

        // 1. Instant 0ms cache display if room was previously viewed
        const cached = messagesCacheRef.current.get(selectedRoomId);
        if (cached && cached.length > 0) {
            setMessages(cached);
            setIsLoadingMessages(false);
        } else {
            setIsLoadingMessages(true);
        }

        // 2. Fetch fresh messages in background (Stale-While-Revalidate)
        getChatMessages(selectedRoomId)
            .then((res) => {
                if (res.messages) {
                    messagesCacheRef.current.set(selectedRoomId, res.messages as unknown as ChatMessageItem[]);
                    if (selectedRoomIdRef.current === selectedRoomId) {
                        setMessages(res.messages as unknown as ChatMessageItem[]);
                    }
                }
            })
            .finally(() => {
                if (selectedRoomIdRef.current === selectedRoomId) {
                    setIsLoadingMessages(false);
                }
            });

        // 3. Mark room as read
        markAsRead(selectedRoomId).then(() => {
            setRooms((prev) =>
                prev.map((r) => (r.id === selectedRoomId ? { ...r, unreadCount: 0 } : r))
            );
        });
    }, [selectedRoomId]);

    // Single Persistent SSE stream: connected ONCE, does NOT disconnect on room switch!
    useEffect(() => {
        if (!currentUserId) return;

        const eventSource = new EventSource("/api/chat/stream");

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // 1. Process new incoming messages across any user room
                if (data.newMessages && data.newMessages.length > 0) {
                    for (const msg of data.newMessages) {
                        // Update cache for this message's room
                        const roomCached = messagesCacheRef.current.get(msg.chatRoomId) || [];
                        if (!roomCached.some((m) => m.id === msg.id)) {
                            messagesCacheRef.current.set(msg.chatRoomId, [...roomCached, msg]);
                        }

                        // If message belongs to currently open room, update UI
                        if (msg.chatRoomId === selectedRoomIdRef.current) {
                            setMessages((prev) => {
                                if (prev.some((m) => m.id === msg.id)) return prev;
                                return [...prev, msg];
                            });

                            // Clear AI typing when AI response arrives
                            if (msg.sender?.role === "AI" || msg.sender?.email === "ai@control.center") {
                                setIsAiTyping(false);
                            }

                            // Mark as read if from someone else
                            if (msg.senderId !== currentUserId) {
                                markAsRead(msg.chatRoomId);
                            }
                        }
                    }
                }

                // 2. Update unread counts and latest messages snippet in sidebar
                if (data.roomUnreadMap || data.roomLatestMessages) {
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

                            if (changedUnread || changedMsg) {
                                hasChanged = true;
                                return {
                                    ...r,
                                    unreadCount: newCount,
                                    ...(changedMsg && {
                                        lastMessage: latestMsg,
                                        updatedAt: new Date(latestMsg.createdAt),
                                    }),
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
            } catch {
                // Ignore parse errors
            }
        };

        eventSource.onerror = () => {
            // EventSource auto-reconnects
        };

        return () => {
            eventSource.close();
        };
    }, [currentUserId]);

    const handleSelectRoom = (roomId: string) => {
        setSelectedRoomId(roomId);
        setMobileView("window");

        // Immediate cache populate for 0ms transition
        const cached = messagesCacheRef.current.get(roomId);
        if (cached && cached.length > 0) {
            setMessages(cached);
            setIsLoadingMessages(false);
        }
    };

    const handleRoomCreated = async (roomId: string) => {
        setSelectedRoomId(roomId);
        setMobileView("window");
        await fetchRooms();
    };

    const handleDeleteRoom = async (roomId: string) => {
        // Optimistic: remove from UI immediately
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        messagesCacheRef.current.delete(roomId);

        // If the deleted room was selected, clear the view
        if (selectedRoomId === roomId) {
            setSelectedRoomId(null);
            setMessages([]);
            setIsAiTyping(false);
        }

        // Call server action in background
        const res = await deleteChatRoom(roomId);
        if (res.error) {
            console.error("Failed to delete room:", res.error);
            // Revert on failure by refetching
            await fetchRooms();
        }
    };

    const currentRoom = rooms.find((r) => r.id === selectedRoomId) || null;

    const handleSendMessage = async (body: string, attachment?: { url: string; name: string; type: string; size: number }) => {
        if (!selectedRoomId || !currentUserId) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: ChatMessageItem = {
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
                name: session?.user?.name || "Me",
                avatarUrl: session?.user?.avatarUrl || null,
                email: session?.user?.email || "",
                role: session?.user?.role || "DEV",
            },
        };

        // Check if message should trigger AI typing indicator
        const isAiTrigger =
            /(?:^|\s)@ai(?:\s|$|[.,!?:;"'])/i.test(body) ||
            (currentRoom?.type === "direct" &&
                currentRoom?.members.some(
                    (m) => m.user.role === "AI" || m.user.email === "ai@control.center"
                ));

        if (isAiTrigger) {
            setIsAiTyping(true);
        }

        // 1. Instant UI update (0ms latency for user)
        setMessages((prev) => [...prev, optimisticMsg]);

        // 2. Instant cache update
        const roomCached = messagesCacheRef.current.get(selectedRoomId) || [];
        messagesCacheRef.current.set(selectedRoomId, [...roomCached, optimisticMsg]);

        // 3. Instant room snippet update in sidebar
        setRooms((prev) => {
            const room = prev.find((r) => r.id === selectedRoomId);
            if (!room) return prev;

            const updatedRoom: ChatRoomSummary = {
                ...room,
                updatedAt: new Date(),
                unreadCount: 0,
                lastMessage: {
                    id: tempId,
                    body: body || (attachment?.url ? "[ไฟล์แนบ]" : ""),
                    senderId: currentUserId,
                    senderName: session?.user?.name || "Me",
                    createdAt: new Date(),
                },
            };

            return [updatedRoom, ...prev.filter((r) => r.id !== selectedRoomId)];
        });

        // 4. Send message in background
        try {
            const res = await sendMessage(selectedRoomId, body, attachment);
            if (res.error) {
                console.error("Failed to send message:", res.error);
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
                messagesCacheRef.current.set(
                    selectedRoomId,
                    (messagesCacheRef.current.get(selectedRoomId) || []).filter((m) => m.id !== tempId)
                );
                setIsAiTyping(false);
                alert("ไม่สามารถส่งข้อความได้: " + res.error);
                return;
            }

            if (res.message) {
                const newMsg = res.message as unknown as ChatMessageItem;
                setMessages((prev) =>
                    prev.map((m) => (m.id === tempId ? newMsg : m))
                );
                messagesCacheRef.current.set(
                    selectedRoomId,
                    (messagesCacheRef.current.get(selectedRoomId) || []).map((m) =>
                        m.id === tempId ? newMsg : m
                    )
                );
            }
        } catch (err: unknown) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setIsAiTyping(false);
            alert("ไม่สามารถส่งข้อความได้: " + ((err as Error)?.message || "Error"));
        }
    };

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
                    onDeleteRoom={handleDeleteRoom}
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
                    isAiTyping={isAiTyping}
                    onSendMessage={handleSendMessage}
                    onRoomUpdated={fetchRooms}
                    onBack={() => setMobileView("sidebar")}
                />
            </div>
        </div>
    );
}
