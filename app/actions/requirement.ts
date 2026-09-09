"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateProjectProgress } from "./progress";
import { getAuthUser } from "@/lib/auth";

export async function updateRequirementStatus(reqId: string, status: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const req = await prisma.requirement.findUnique({ where: { id: reqId } });
    if (!req) return { error: "Requirement not found" };

    if (user.role !== "ADMIN" && user.role !== "PM" && req.assigneeId !== user.id) {
        return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
    }

    // อัปเดตสถานะ
    const updated = await prisma.requirement.update({
        where: { id: reqId },
        data: { status },
    });

    // สั่งคำนวณ Progress ของโปรเจกต์ใหม่
    await updateProjectProgress(updated.projectId);

    revalidatePath("/projects/[id]", "page");
    revalidatePath("/", "page");
    return { success: true };
}