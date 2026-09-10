import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (!token?.sub) {
        return NextResponse.json(
            { unreadNotificationsCount: 0, unreadNotifications: [], unreadChatCount: 0, pendingApprovalsCount: 0 },
            { status: 401 }
        );
    }
    const userId = token.sub;
    const role = (token as any)?.role || "USER";

    try {
        // Parallel fetch notifications, indexed unread chat count, and (if admin) pending approvals in 1 round-trip
        const queries: [Promise<any>, Promise<any>, Promise<number>?] = [
            prisma.notification.findMany({
                where: { userId, isRead: false },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { id: true, title: true, message: true, link: true, createdAt: true }
            }),
            prisma.$queryRaw<{ count: number }[]>`
                SELECT COUNT(*)::int AS count
                FROM "ChatMessage" m
                INNER JOIN "ChatMember" cm ON cm."chatRoomId" = m."chatRoomId"
                WHERE cm."userId" = ${userId}
                  AND m."senderId" != ${userId}
                  AND m."createdAt" > cm."lastReadAt"
            `
        ];

        if (role === "ADMIN") {
            queries.push(prisma.user.count({ where: { isApproved: false } }));
        }

        const [notifications, chatResult, pendingApprovalsCount = 0] = await Promise.all(queries);
        const unreadChatCount = chatResult[0]?.count ?? 0;

        return NextResponse.json(
            {
                unreadNotificationsCount: notifications.length,
                unreadNotifications: notifications,
                unreadChatCount,
                pendingApprovalsCount,
            },
            {
                headers: {
                    "Cache-Control": "private, no-cache, no-store, must-revalidate",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching badges:", error);
        return NextResponse.json(
            { unreadNotificationsCount: 0, unreadNotifications: [], unreadChatCount: 0, pendingApprovalsCount: 0 },
            { status: 500 }
        );
    }
}
