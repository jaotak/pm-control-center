"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { processAIChatMessage } from "@/lib/ai";
import { after } from "next/server";

export interface ChatUserSummary {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    department: string | null;
}

export interface ChatRoomSummary {
    id: string;
    name: string | null;
    type: "direct" | "group";
    updatedAt: Date;
    members: {
        id: string;
        userId: string;
        lastReadAt: Date;
        user: ChatUserSummary;
    }[];
    lastMessage?: {
        id: string;
        body: string;
        senderId: string;
        senderName: string;
        createdAt: Date;
    } | null;
    unreadCount: number;
    displayName: string;
    displayAvatar: string | null;
}

/**
 * Get all available users for starting a new chat
 */
export async function getChatUsers() {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    try {
        const users = await prisma.user.findMany({
            where: {
                id: { not: authUser.id },
                isActive: true,
                isApproved: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
                department: true,
            },
            orderBy: { name: "asc" },
        });

        console.log("getChatUsers returning", users.length, "users");
        return { users };
    } catch (error) {
        console.error("Error fetching chat users:", error);
        return { error: "Failed to fetch users" };
    }
}

/**
 * Get all chat rooms the current user is a member of
 */
export async function getChatRooms() {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    try {
        // Parallel fetch memberships and indexed unread counts per room in 1 roundtrip
        const [memberships, unreadRows] = await Promise.all([
            prisma.chatMember.findMany({
                where: { userId: authUser.id },
                select: {
                    chatRoomId: true,
                    lastReadAt: true,
                    chatRoom: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            updatedAt: true,
                            members: {
                                select: {
                                    id: true,
                                    userId: true,
                                    lastReadAt: true,
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                            avatarUrl: true,
                                            role: true,
                                            department: true,
                                        },
                                    },
                                },
                            },
                            messages: {
                                orderBy: { createdAt: "desc" },
                                take: 1,
                                select: {
                                    id: true,
                                    body: true,
                                    senderId: true,
                                    createdAt: true,
                                    attachmentUrl: true,
                                    sender: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    chatRoom: {
                        updatedAt: "desc",
                    },
                },
            }),
            prisma.$queryRaw<{ chatRoomId: string; count: number }[]>`
                SELECT m."chatRoomId", COUNT(*)::int AS count
                FROM "ChatMessage" m
                INNER JOIN "ChatMember" cm ON cm."chatRoomId" = m."chatRoomId"
                WHERE cm."userId" = ${authUser.id}
                  AND m."senderId" != ${authUser.id}
                  AND m."createdAt" > cm."lastReadAt"
                GROUP BY m."chatRoomId"
            `,
        ]);

        const unreadMap: Record<string, number> = {};
        for (const row of unreadRows) {
            unreadMap[row.chatRoomId] = row.count;
        }

        // Compute unread count and formatting for each room
        const rooms: ChatRoomSummary[] = memberships.map((membership) => {
            const room = membership.chatRoom;
            const otherMembers = room.members.filter((m) => m.userId !== authUser.id);

            let displayName = room.name || "Chat Room";
            let displayAvatar: string | null = null;

            if (room.type === "direct") {
                if (otherMembers.length > 0) {
                    displayName = otherMembers[0].user.name;
                    displayAvatar = otherMembers[0].user.avatarUrl;
                } else {
                    displayName = "Chat (Just You)";
                }
            }

            const unreadCount = unreadMap[room.id] || 0;
            const lastMsg = room.messages[0];

            return {
                id: room.id,
                name: room.name,
                type: room.type as "direct" | "group",
                updatedAt: room.updatedAt,
                members: room.members.map((m) => ({
                    id: m.id,
                    userId: m.userId,
                    lastReadAt: m.lastReadAt,
                    user: m.user,
                })),
                lastMessage: lastMsg
                    ? {
                          id: lastMsg.id,
                          body: lastMsg.body,
                          senderId: lastMsg.senderId,
                          senderName: lastMsg.sender.name,
                          createdAt: lastMsg.createdAt,
                      }
                    : null,
                unreadCount,
                displayName,
                displayAvatar,
            };
        });

        return { rooms };
    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        return { error: "Failed to fetch chat rooms" };
    }
}

/**
 * Start or get existing Direct Message chat room with target user
 */
export async function createDirectChat(targetUserId: string) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };
    if (authUser.id === targetUserId) {
        return { error: "Cannot create direct chat with yourself" };
    }

    try {
        // Fast indexed SQL lookup: finds if a direct room exists between these 2 users in 2ms
        const existing = await prisma.$queryRaw<{ id: string }[]>`
            SELECT cr.id
            FROM "ChatRoom" cr
            INNER JOIN "ChatMember" cm1 ON cm1."chatRoomId" = cr.id AND cm1."userId" = ${authUser.id}
            INNER JOIN "ChatMember" cm2 ON cm2."chatRoomId" = cr.id AND cm2."userId" = ${targetUserId}
            WHERE cr.type = 'direct'
            LIMIT 1
        `;

        if (existing.length > 0) {
            return { roomId: existing[0].id };
        }

        // Create new direct chat room
        const newRoom = await prisma.chatRoom.create({
            data: {
                type: "direct",
                members: {
                    create: [
                        { userId: authUser.id },
                        { userId: targetUserId },
                    ],
                },
            },
        });

        return { roomId: newRoom.id };
    } catch (error) {
        console.error("Error creating direct chat:", error);
        return { error: "Failed to create direct chat" };
    }
}

/**
 * Create a new group chat room
 */
export async function createGroupChat(name: string, memberIds: string[]) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    const trimmedName = name.trim();
    if (!trimmedName) {
        return { error: "Group name is required" };
    }

    // Ensure current user is in members list
    const allMemberIds = Array.from(new Set([authUser.id, ...memberIds.filter(Boolean)]));
    if (allMemberIds.length < 2) {
        return { error: "Group must have at least 2 members" };
    }

    try {
        const newRoom = await prisma.chatRoom.create({
            data: {
                name: trimmedName,
                type: "group",
                members: {
                    create: allMemberIds.map((userId) => ({ userId })),
                },
            },
        });

        return { roomId: newRoom.id };
    } catch (error) {
        console.error("Error creating group chat:", error);
        return { error: "Failed to create group chat" };
    }
}

/**
 * Send a message in a chat room
 */
export async function sendMessage(
    chatRoomId: string,
    body: string,
    attachment?: { url: string; name: string; type: string; size: number; }
) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    const trimmedBody = body.trim();
    if (!trimmedBody && !attachment) {
        return { error: "Message cannot be empty" };
    }

    try {
        const now = new Date();

        // 1. Fast unique lookup to verify membership AND check room/AI status in 1 round-trip
        const member = await prisma.chatMember.findUnique({
            where: {
                chatRoomId_userId: {
                    chatRoomId,
                    userId: authUser.id,
                },
            },
            select: {
                id: true,
                chatRoom: {
                    select: {
                        type: true,
                        members: {
                            select: {
                                user: {
                                    select: { role: true, email: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!member) {
            return { error: "You are not a member of this chat room" };
        }

        const room = member.chatRoom;

        // 2. Create message and return immediately
        const message = await prisma.chatMessage.create({
            data: {
                chatRoomId,
                senderId: authUser.id,
                body: trimmedBody,
                attachmentUrl: attachment?.url || null,
                attachmentName: attachment?.name || null,
                attachmentType: attachment?.type || null,
                attachmentSize: attachment?.size || null,
                createdAt: now,
            },
            select: {
                id: true,
                body: true,
                attachmentUrl: true,
                attachmentName: true,
                attachmentType: true,
                attachmentSize: true,
                senderId: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        // 3. Update room updatedAt and sender lastReadAt concurrently in background with after()
        after(async () => {
            try {
                await Promise.all([
                    prisma.chatRoom.update({
                        where: { id: chatRoomId },
                        data: { updatedAt: now },
                    }),
                    prisma.chatMember.update({
                        where: {
                            chatRoomId_userId: {
                                chatRoomId,
                                userId: authUser.id,
                            },
                        },
                        data: { lastReadAt: now },
                    }),
                ]);
            } catch (err) {
                console.error("Error updating room timestamps:", err);
            }
        });

        // 4. Trigger AI processing if @AI is mentioned or if it's a direct chat with AI
        const isAiMentioned = /(?:^|\s)@ai(?:\s|$|[.,!?:;"'])/i.test(trimmedBody);
        const isDirectWithAi = room?.type === "direct" && 
                               room.members.length === 2 && 
                               room.members.some(m => m.user.role === "AI" || m.user.email === "ai@control.center");
        const isSenderAi = authUser.role === "AI" || authUser.email === "ai@control.center";

        if (!isSenderAi && (isAiMentioned || isDirectWithAi)) {
            after(async () => {
                try {
                    await processAIChatMessage(message.id);
                } catch (err) {
                    console.error("Failed to process AI chat:", err);
                }
            });
        }

        return { message };
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: "Failed to send message" };
    }
}

/**
 * Get messages for a chat room in a single optimized query
 */
export async function getChatMessages(chatRoomId: string, limit = 60) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    try {
        const messages = await prisma.chatMessage.findMany({
            where: {
                chatRoomId,
                chatRoom: {
                    members: {
                        some: { userId: authUser.id }
                    }
                }
            },
            orderBy: { createdAt: "asc" },
            take: limit,
            select: {
                id: true,
                body: true,
                attachmentUrl: true,
                attachmentName: true,
                attachmentType: true,
                attachmentSize: true,
                senderId: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return { messages };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { error: "Failed to fetch messages" };
    }
}

/**
 * Mark a chat room as read for current user using primary/unique index
 */
export async function markAsRead(chatRoomId: string) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    try {
        await prisma.chatMember.update({
            where: {
                chatRoomId_userId: {
                    chatRoomId,
                    userId: authUser.id,
                },
            },
            data: {
                lastReadAt: new Date(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error marking as read:", error);
        return { error: "Failed to mark as read" };
    }
}

/**
 * Get total unread message count for current user
 */
export async function getChatUnreadCount() {
    const authUser = await getAuthUser();
    if (!authUser) return { count: 0 };

    try {
        const result = await prisma.$queryRaw<{ count: number }[]>`
            SELECT COUNT(*)::int AS count
            FROM "ChatMessage" m
            INNER JOIN "ChatMember" cm ON cm."chatRoomId" = m."chatRoomId"
            WHERE cm."userId" = ${authUser.id}
              AND m."senderId" != ${authUser.id}
              AND m."createdAt" > cm."lastReadAt"
        `;
        return { count: result[0]?.count ?? 0 };
    } catch {
        return { count: 0 };
    }
}

/**
 * Delete a chat room and all its messages/members (cascade)
 * Only members of the room can delete it.
 */
export async function deleteChatRoom(chatRoomId: string) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    try {
        // Verify the current user is a member of this room
        const membership = await prisma.chatMember.findUnique({
            where: {
                chatRoomId_userId: {
                    chatRoomId,
                    userId: authUser.id,
                },
            },
            select: { id: true },
        });

        if (!membership) {
            return { error: "You are not a member of this chat room" };
        }

        // Delete the room — ChatMember and ChatMessage cascade automatically
        await prisma.chatRoom.delete({
            where: { id: chatRoomId },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting chat room:", error);
        return { error: "Failed to delete chat room" };
    }
}

export async function leaveChatRoom(chatRoomId: string) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    const membership = await prisma.chatMember.findUnique({
        where: { chatRoomId_userId: { chatRoomId, userId: authUser.id } },
        select: { id: true, chatRoom: { select: { type: true, _count: { select: { members: true } } } } },
    });
    if (!membership) return { error: "You are not a member of this chat room" };

    if (membership.chatRoom._count.members <= 1 || membership.chatRoom.type === "direct") {
        await prisma.chatRoom.delete({ where: { id: chatRoomId } });
        return { success: true, deleted: true };
    }

    await prisma.chatMember.delete({ where: { id: membership.id } });
    return { success: true, deleted: false };
}

export async function addChatMembers(chatRoomId: string, memberIds: string[]) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    const membership = await prisma.chatMember.findUnique({
        where: { chatRoomId_userId: { chatRoomId, userId: authUser.id } },
        select: { chatRoom: { select: { type: true } } },
    });
    if (!membership) return { error: "You are not a member of this chat room" };
    if (membership.chatRoom.type !== "group") return { error: "Can only add members to group chats" };

    const uniqueIds = [...new Set(memberIds.filter((id) => id && id !== authUser.id))];
    if (uniqueIds.length === 0) return { error: "No members to add" };

    await prisma.chatMember.createMany({
        data: uniqueIds.map((userId) => ({ chatRoomId, userId })),
        skipDuplicates: true,
    });

    return { success: true };
}

export async function deleteChatMessage(messageId: string) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, chatRoomId: true },
    });
    if (!message) return { error: "Message not found" };
    if (message.senderId !== authUser.id && authUser.role !== "ADMIN") {
        return { error: "Forbidden" };
    }

    const membership = await prisma.chatMember.findUnique({
        where: { chatRoomId_userId: { chatRoomId: message.chatRoomId, userId: authUser.id } },
        select: { id: true },
    });
    if (!membership) return { error: "Forbidden" };

    await prisma.chatMessage.delete({ where: { id: messageId } });
    return { success: true };
}

export async function updateGroupChat(chatRoomId: string, name: string, memberIds: string[]) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    const membership = await prisma.chatMember.findUnique({
        where: { chatRoomId_userId: { chatRoomId, userId: authUser.id } },
        select: { chatRoom: { select: { type: true } } },
    });
    if (!membership) return { error: "You are not a member of this chat room" };
    if (membership.chatRoom.type !== "group") return { error: "Can only update group chats" };

    // Clean member IDs (ensure the current user is always included)
    const uniqueIds = [...new Set([...memberIds.filter((id) => id), authUser.id])];
    
    // Update name
    await prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: { name: name.trim() || null },
    });

    // Get current members
    const currentMembers = await prisma.chatMember.findMany({
        where: { chatRoomId },
        select: { userId: true, id: true },
    });
    const currentMemberIds = currentMembers.map(m => m.userId);

    // Find who to add and who to remove
    const toAdd = uniqueIds.filter(id => !currentMemberIds.includes(id));
    const toRemove = currentMemberIds.filter(id => !uniqueIds.includes(id));

    if (toAdd.length > 0) {
        await prisma.chatMember.createMany({
            data: toAdd.map(userId => ({ chatRoomId, userId })),
            skipDuplicates: true,
        });
    }

    if (toRemove.length > 0) {
        await prisma.chatMember.deleteMany({
            where: { chatRoomId, userId: { in: toRemove } },
        });
    }

    // Insert a system message to indicate update
    await prisma.chatMessage.create({
        data: {
            chatRoomId,
            senderId: authUser.id,
            body: `ได้อัปเดตการตั้งค่ากลุ่ม`,
        },
    });

    return { success: true };
}
