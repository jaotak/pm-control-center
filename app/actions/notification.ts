"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function getUnreadNotifications() {
    const user = await getAuthUser();
    if (!user) return [];
    return prisma.notification.findMany({
        where: { userId: user.id, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 10,
    });
}

export async function markNotificationAsRead(id: string) {
    const user = await getAuthUser();
    if (!user) return;
    await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
    });
}

export async function markAllNotificationsAsRead() {
    const user = await getAuthUser();
    if (!user) return;
    await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
    });
}
