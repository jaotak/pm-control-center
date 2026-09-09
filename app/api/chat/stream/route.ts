import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (!token?.sub) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = token.sub;

    const { searchParams } = new URL(req.url);
    const activeRoomId = searchParams.get("roomId");

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let lastSeenTime = new Date(Date.now() - 5000); // 5 seconds before connection start
            let isClosed = false;

            const send = (data: object) => {
                if (isClosed) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch {
                    isClosed = true;
                }
            };

            const poll = async () => {
                if (isClosed) return;

                try {
                    // 1. Calculate unread messages count per room & total unread
                    const memberships = await prisma.chatMember.findMany({
                        where: { userId },
                        select: {
                            chatRoomId: true,
                            lastReadAt: true,
                        },
                    });

                    let totalUnread = 0;
                    const roomUnreadMap: Record<string, number> = {};

                    for (const m of memberships) {
                        const count = await prisma.chatMessage.count({
                            where: {
                                chatRoomId: m.chatRoomId,
                                senderId: { not: userId },
                                createdAt: { gt: m.lastReadAt },
                            },
                        });
                        roomUnreadMap[m.chatRoomId] = count;
                        totalUnread += count;
                    }

                    // 2. Fetch new messages for the currently open chat room if specified
                    let newMessages: any[] = [];
                    if (activeRoomId) {
                        // Ensure user is member
                        const isMember = memberships.some((m) => m.chatRoomId === activeRoomId);
                        if (isMember) {
                            newMessages = await prisma.chatMessage.findMany({
                                where: {
                                    chatRoomId: activeRoomId,
                                    createdAt: { gt: lastSeenTime },
                                },
                                orderBy: { createdAt: "asc" },
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

                            if (newMessages.length > 0) {
                                lastSeenTime = newMessages[newMessages.length - 1].createdAt;
                            }
                        }
                    }

                    send({
                        totalUnread,
                        roomUnreadMap,
                        activeRoomId: activeRoomId || null,
                        newMessages,
                        timestamp: Date.now(),
                    });
                } catch (err) {
                    // Ignore transient DB read error
                }
            };

            // Send initial state immediately
            await poll();

            // Poll every 3 seconds for snappy messaging
            const interval = setInterval(poll, 3000);

            // Cleanup when client disconnects
            req.signal.addEventListener("abort", () => {
                isClosed = true;
                clearInterval(interval);
                try {
                    controller.close();
                } catch {
                    // already closed
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
