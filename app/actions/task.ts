"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateProjectProgress, logActivity } from "./progress";
import { getAuthUser, requireProjectAccess } from "@/lib/auth";

// ==========================================
// 1. Toggle task completion (checkbox)
// ==========================================
export async function toggleTaskStatus(taskId: string, isCompleted: boolean) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) return { error: "Task not found" };
    if (existingTask.projectId) await requireProjectAccess(existingTask.projectId);

    if (user.role !== "ADMIN" && user.role !== "PM" && existingTask.assigneeId !== user.id) {
        return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
    }

    const task = await prisma.task.update({
        where: { id: taskId },
        data: { isCompleted },
    });

    if (task.projectId) {
        await updateProjectProgress(task.projectId);

        if (user) {
            const actionMsg = isCompleted
                ? `ทำ Task เสร็จสิ้น: ${task.title}`
                : `ยกเลิกสถานะ Task: ${task.title}`;
            await logActivity(task.projectId, user.id, actionMsg);
        }
    }

    revalidatePath("/projects/[id]", "page");
    revalidatePath("/", "page");
    revalidatePath("/tasks", "page");
    revalidatePath("/calendar", "page");
    return { success: true };
}

// ==========================================
// 2. Create a global/calendar task
// ==========================================
export async function createGlobalTask(title: string, dueDate: string, projectId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };
    if (projectId) await requireProjectAccess(projectId, "manager");

    const task = await prisma.task.create({
        data: {
            title,
            dueDate: new Date(dueDate),
            projectId: projectId === "" ? null : projectId,
            assigneeId: user.id,
        }
    });

    if (task.projectId && user) {
        await updateProjectProgress(task.projectId);
        await logActivity(task.projectId, user.id, `สร้าง Task ใหม่: ${task.title}`);
    }

    revalidatePath("/calendar", "page");
    revalidatePath("/tasks", "page");
    revalidatePath("/projects/[id]", "page");
    revalidatePath("/", "page");
}

// ==========================================
// 3. Log time spent on a task
// ==========================================
export async function logTime(taskId: string, hours: number) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };
    if (!Number.isFinite(hours) || hours <= 0) return { error: "Hours must be positive" };

    const existingTask = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true, assigneeId: true } });
    if (!existingTask) return { error: "Task not found" };
    if (existingTask.projectId) await requireProjectAccess(existingTask.projectId);
    if (user.role === "DEV" && existingTask.assigneeId !== user.id) return { error: "Forbidden" };

    const task = await prisma.task.update({
        where: { id: taskId },
        data: { loggedHours: { increment: hours } },
    });

    if (task.projectId) {
        await logActivity(task.projectId, user.id, `บันทึกเวลา ${hours}h สำหรับ Task: ${task.title}`);

        // Warn if logged hours exceed estimated hours by > 20%
        if (task.estimatedHours && task.loggedHours! > task.estimatedHours * 1.2) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    title: "Time Over Estimate",
                    message: `Task "${task.title}" ใช้เวลาเกิน Estimate แล้ว (${task.loggedHours?.toFixed(1)}h / ${task.estimatedHours}h)`,
                    link: `/projects/${task.projectId}?tab=tasks`,
                }
            });
        }
    }

    revalidatePath("/tasks", "page");
    revalidatePath("/projects/[id]", "page");
}
