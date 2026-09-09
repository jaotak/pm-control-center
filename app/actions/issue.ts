"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";

export async function updateIssueStatus(issueId: string, newStatus: string, projectId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) return { error: "Issue not found" };

    if (user.role !== "ADMIN" && user.role !== "PM" && issue.assigneeId !== user.id) {
        return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
    }

    await prisma.issue.update({
        where: { id: issueId },
        data: { status: newStatus }
    });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}