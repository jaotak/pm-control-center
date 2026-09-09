"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { updateProjectProgress, logActivity } from "./progress";

// ============================================
// Soft-delete: sets deletedAt instead of removing
// ============================================

export async function deleteRequirement(id: string, projectId: string) {
    const user = await getAuthUser();

    const req = await prisma.requirement.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    if (user && req) {
        await logActivity(projectId, user.id, `ย้าย Requirement [${req.reqCode}]: "${req.title}" ไปยังถังขยะ`);
    }

    await updateProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
}

export async function deleteUAT(id: string, projectId: string) {
    const user = await getAuthUser();

    const uat = await prisma.uATCase.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    if (user && uat) {
        await logActivity(projectId, user.id, `ย้าย UAT Case [${uat.uatCode}]: "${uat.title}" ไปยังถังขยะ`);
    }

    await updateProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
}

export async function deleteIssue(id: string, projectId: string) {
    const user = await getAuthUser();

    const issue = await prisma.issue.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    if (user && issue) {
        await logActivity(projectId, user.id, `ย้าย Issue [${issue.issueCode}]: "${issue.title}" ไปยังถังขยะ`);
    }

    await updateProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
}

// ============================================
// Soft-delete for tasks (consolidated from delete.ts)
// ============================================
export async function deleteTask(taskId: string) {
    const user = await getAuthUser();

    const task = await prisma.task.update({
        where: { id: taskId },
        data: { deletedAt: new Date() },
    });

    if (task.projectId) {
        await updateProjectProgress(task.projectId);
        if (user) {
            await logActivity(task.projectId, user.id, `ย้าย Task "${task.title}" ไปยังถังขยะ`);
        }
    }

    revalidatePath("/projects/[id]", "page");
    revalidatePath("/", "page");
    revalidatePath("/tasks", "page");
}