import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (!token?.sub) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = token.sub;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let lastSeenTime = new Date(Date.now() - 3000); // 3 seconds before connection start
            let isClosed = false;
            let tickCount = 0;

            const send = (data: object) => {
                if (isClosed) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch {
                    isClosed = true;
                }
            };

            const sendPing = () => {
                if (isClosed) return;
                try {
                    controller.enqueue(encoder.encode(`: ping\n\n`));
                } catch {
                    isClosed = true;
                }
            };

            // Fast helper to get unread map in a single SQL query
            const fetchUnreadMap = async () => {
                const rows = await prisma.$queryRaw<{ chatRoomId: string; count: number }[]>`
                    SELECT m."chatRoomId", COUNT(*)::int AS count
                    FROM "ChatMessage" m
                    INNER JOIN "ChatMember" cm ON cm."chatRoomId" = m."chatRoomId"
                    WHERE cm."userId" = ${userId}
                      AND m."senderId" != ${userId}
                      AND m."createdAt" > cm."lastReadAt"
                    GROUP BY m."chatRoomId"
                `;
                const map: Record<string, number> = {};
                let total = 0;
                for (const r of rows) {
                    map[r.chatRoomId] = r.count;
                    total += r.count;
                }
                return { map, total };
            };

            // Initial poll: sends complete initial status
            const initialPoll = async () => {
                try {
                    const { map: roomUnreadMap, total: totalUnread } = await fetchUnreadMap();

                    // Fetch latest message per room
                    const memberships = await prisma.chatMember.findMany({
                        where: { userId },
                        select: {
                            chatRoomId: true,
                            chatRoom: {
                                select: {
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
                                                select: { name: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    });

                    const roomLatestMessages: Record<string, { id: string, body: string, senderId: string, senderName?: string | null, createdAt: Date }> = {};
                    for (const m of memberships) {
                        if (m.chatRoom?.messages?.length > 0) {
                            const latest = m.chatRoom.messages[0];
                            roomLatestMessages[m.chatRoomId] = {
                                id: latest.id,
                                body: latest.body || (latest.attachmentUrl ? "[ไฟล์แนบ]" : ""),
                                senderId: latest.senderId,
                                senderName: latest.sender?.name,
                                createdAt: latest.createdAt,
                            };
                        }
                    }

                    send({
                        totalUnread,
                        roomUnreadMap,
                        roomLatestMessages,
                        newMessages: [],
                        timestamp: Date.now(),
                    });
                } catch {
                    // Ignore initial error
                }
            };

            // Lightweight delta poll: only runs 1 indexed query when idle
            const deltaPoll = async () => {
                if (isClosed) return;
                tickCount++;

                try {
                    // Query for ANY new messages in rooms the user belongs to since lastSeenTime
                    const newMessages = await prisma.chatMessage.findMany({
                        where: {
                            chatRoom: {
                                members: { some: { userId } }
                            },
                            createdAt: { gt: lastSeenTime }
                        },
                        orderBy: { createdAt: "asc" },
                        select: {
                            id: true,
                            chatRoomId: true,
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
                                }
                            }
                        }
                    });

                    if (newMessages.length > 0) {
                        lastSeenTime = newMessages[newMessages.length - 1].createdAt;

                        // Fetch updated unread counts
                        const { map: roomUnreadMap, total: totalUnread } = await fetchUnreadMap();

                        // Build updated latest message snippet for affected rooms
                        const roomLatestMessages: Record<string, { id: string, body: string, senderId: string, senderName?: string | null, createdAt: Date }> = {};
                        for (const msg of newMessages) {
                            roomLatestMessages[msg.chatRoomId] = {
                                id: msg.id,
                                body: msg.body || (msg.attachmentUrl ? "[ไฟล์แนบ]" : ""),
                                senderId: msg.senderId,
                                senderName: msg.sender.name,
                                createdAt: msg.createdAt,
                            };
                        }

                        send({
                            totalUnread,
                            roomUnreadMap,
                            roomLatestMessages,
                            newMessages,
                            timestamp: Date.now(),
                        });
                    } else if (tickCount % 5 === 0) {
                        // Periodic heartbeat (every ~10-12s) to ensure connection stays active and unread is synced
                        const { map: roomUnreadMap, total: totalUnread } = await fetchUnreadMap();
                        send({
                            totalUnread,
                            roomUnreadMap,
                            newMessages: [],
                            timestamp: Date.now(),
                        });
                    } else {
                        sendPing();
                    }
                } catch {
                    // Transient DB read error, send ping
                    sendPing();
                }
            };

            await initialPoll();

            // Poll every 2.5 seconds with lightweight query
            const interval = setInterval(deltaPoll, 2500);

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
