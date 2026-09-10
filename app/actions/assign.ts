"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendNotification } from "./notification";
import { getAuthUser } from "@/lib/auth";
import { logActivity } from "./progress";

export async function updateItemAssignee(
    type: 'req' | 'uat' | 'issue' | 'task',
    itemId: string,
    assigneeId: string,
    projectId: string
) {
    const user = await getAuthUser();
    const val = assigneeId === "" ? null : assigneeId;
    let itemName = "";

    if (type === 'req') {
        const req = await prisma.requirement.update({ where: { id: itemId }, data: { assigneeId: val } });
        itemName = `Requirement: ${req.title}`;
    }
    if (type === 'uat') {
        const uat = await prisma.uATCase.update({ where: { id: itemId }, data: { assigneeId: val } });
        itemName = `UAT Case: ${uat.title}`;
    }
    if (type === 'issue') {
        const issue = await prisma.issue.update({ where: { id: itemId }, data: { assigneeId: val } });
        itemName = `Issue: ${issue.title}`;
    }
    if (type === 'task') {
        const task = await prisma.task.update({ where: { id: itemId }, data: { assigneeId: val } });
        itemName = `Task: ${task.title}`;
    }

    // Send notification to new assignee if it's not the current user
    if (val && val !== user?.id) {
        const tabName = type === 'req' ? 'requirements' : type === 'issue' ? 'issues' : type === 'task' ? 'tasks' : 'uat';
        await sendNotification(
            val,
            "คุณได้รับมอบหมายงานใหม่",
            `คุณถูกกำหนดให้รับผิดชอบ: ${itemName}`,
            `/projects/${projectId}?tab=${tabName}`
        );
    }

    if (user && projectId) {
        const targetUser = val ? await prisma.user.findUnique({ where: { id: val } }) : null;
        const assigneeName = targetUser ? targetUser.name : "ยกเลิกผู้รับผิดชอบ";
        await logActivity(projectId, user.id, `มอบหมาย ${itemName} ให้กับ "${assigneeName}"`);
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/tasks");
}