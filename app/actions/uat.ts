"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateProjectProgress } from "./progress";
import { getAuthUser } from "@/lib/auth";

export async function updateUATStatus(uatId: string, status: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const uatCase = await prisma.uATCase.findUnique({ where: { id: uatId } });
    if (!uatCase) return { error: "UAT Case not found" };

    if (user.role !== "ADMIN" && user.role !== "PM" && uatCase.assigneeId !== user.id) {
        return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
    }

    const uat = await prisma.uATCase.update({
        where: { id: uatId },
        data: { status },
    });

    await updateProjectProgress(uat.projectId); // สั่งคำนวณหลอด Progress ใหม่

    revalidatePath("/projects/[id]", "page");
    revalidatePath("/", "page");
    return { success: true };
}