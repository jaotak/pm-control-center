"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUnreadNotifications(userId: string) {
    return await prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 10,
    });
}

export async function markNotificationAsRead(id: string) {
    await prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });
    revalidatePath("/");
}

// ฟังก์ชันสำหรับยิงแจ้งเตือน (ไว้เรียกใช้ตอน Assign งานในอนาคต)
export async function sendNotification(userId: string, title: string, message: string, link?: string) {
    await prisma.notification.create({
        data: { userId, title, message, link }
    });
}