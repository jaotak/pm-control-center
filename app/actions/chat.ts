"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
        const memberships = await prisma.chatMember.findMany({
            where: { userId: authUser.id },
            include: {
                chatRoom: {
                    include: {
                        members: {
                            include: {
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
                            include: {
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
        });

        // Compute unread count and formatting for each room
        const rooms: ChatRoomSummary[] = await Promise.all(
            memberships.map(async (membership) => {
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

                // Count unread messages created after user's lastReadAt and not sent by user
                const unreadCount = await prisma.chatMessage.count({
                    where: {
                        chatRoomId: room.id,
                        senderId: { not: authUser.id },
                        createdAt: { gt: membership.lastReadAt },
                    },
                });

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
            })
        );

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
        // Find existing direct chat between these two users
        const existingRooms = await prisma.chatRoom.findMany({
            where: {
                type: "direct",
                AND: [
                    { members: { some: { userId: authUser.id } } },
                    { members: { some: { userId: targetUserId } } },
                ],
            },
            include: {
                members: true,
            },
        });

        // Exact match with exactly these 2 members
        const exactMatch = existingRooms.find((r) => r.members.length === 2);
        if (exactMatch) {
            return { roomId: exactMatch.id };
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
        // Verify user is a member
        const member = await prisma.chatMember.findUnique({
            where: {
                chatRoomId_userId: {
                    chatRoomId,
                    userId: authUser.id,
                },
            },
        });

        if (!member) {
            return { error: "You are not a member of this chat room" };
        }

        const now = new Date();

        // Create message
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
            include: {
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

        // Update chat room updatedAt and member's lastReadAt
        await prisma.$transaction([
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

        return { message };
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: "Failed to send message" };
    }
}

/**
 * Get messages for a chat room
 */
export async function getChatMessages(chatRoomId: string, limit = 60) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    try {
        // Verify user is a member
        const member = await prisma.chatMember.findUnique({
            where: {
                chatRoomId_userId: {
                    chatRoomId,
                    userId: authUser.id,
                },
            },
        });

        if (!member) {
            return { error: "You are not a member of this chat room" };
        }

        const messages = await prisma.chatMessage.findMany({
            where: { chatRoomId },
            orderBy: { createdAt: "asc" },
            take: limit,
            include: {
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
 * Mark a chat room as read for current user
 */
export async function markAsRead(chatRoomId: string) {
    const authUser = await getAuthUser();
    if (!authUser) return { error: "Unauthorized" };

    try {
        await prisma.chatMember.updateMany({
            where: {
                chatRoomId,
                userId: authUser.id,
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
        const memberships = await prisma.chatMember.findMany({
            where: { userId: authUser.id },
            select: {
                chatRoomId: true,
                lastReadAt: true,
            },
        });

        if (memberships.length === 0) return { count: 0 };

        let totalUnread = 0;
        for (const m of memberships) {
            const unread = await prisma.chatMessage.count({
                where: {
                    chatRoomId: m.chatRoomId,
                    senderId: { not: authUser.id },
                    createdAt: { gt: m.lastReadAt },
                },
            });
            totalUnread += unread;
        }

        return { count: totalUnread };
    } catch {
        return { count: 0 };
    }
}
