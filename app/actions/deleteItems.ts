"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assertItemBelongsToProject, getAuthUser, requireProjectAccess } from "@/lib/auth";
import { updateProjectProgress, logActivity } from "./progress";

// ============================================
// Soft-delete: sets deletedAt instead of removing
// ============================================

export async function deleteRequirement(id: string, projectId: string) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.requirement.findUnique({ where: { id }, select: { projectId: true } });
    if (!existing) throw new Error("Requirement not found");
    assertItemBelongsToProject(existing.projectId, projectId);

    const req = await prisma.requirement.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    await logActivity(projectId, user.id, `ย้าย Requirement [${req.reqCode}]: "${req.title}" ไปยังถังขยะ`);

    await updateProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
}

export async function deleteUAT(id: string, projectId: string) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.uATCase.findUnique({ where: { id }, select: { projectId: true } });
    if (!existing) throw new Error("UAT Case not found");
    assertItemBelongsToProject(existing.projectId, projectId);

    const uat = await prisma.uATCase.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    await logActivity(projectId, user.id, `ย้าย UAT Case [${uat.uatCode}]: "${uat.title}" ไปยังถังขยะ`);

    await updateProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
}

export async function deleteIssue(id: string, projectId: string) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.issue.findUnique({ where: { id }, select: { projectId: true } });
    if (!existing) throw new Error("Issue not found");
    assertItemBelongsToProject(existing.projectId, projectId);

    const issue = await prisma.issue.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    await logActivity(projectId, user.id, `ย้าย Issue [${issue.issueCode}]: "${issue.title}" ไปยังถังขยะ`);

    await updateProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
}

// ============================================
// Soft-delete for tasks (consolidated from delete.ts)
// ============================================
export async function deleteTask(taskId: string) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const existingTask = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (!existingTask) throw new Error("Task not found");
    if (existingTask.projectId) await requireProjectAccess(existingTask.projectId, "manager");

    const task = await prisma.task.update({
        where: { id: taskId },
        data: { deletedAt: new Date() },
    });

    if (task.projectId) {
        await updateProjectProgress(task.projectId);
        await logActivity(task.projectId, user.id, `ย้าย Task "${task.title}" ไปยังถังขยะ`);
    }

    revalidatePath("/projects/[id]", "page");
    revalidatePath("/", "page");
    revalidatePath("/tasks", "page");
}
