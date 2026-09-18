"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/progress";
import { assertItemBelongsToProject, requireProjectAccess } from "@/lib/auth";

export async function editRequirement(
    id: string,
    title: string,
    description: string,
    projectId: string,
    priority?: string,
    dueDate?: string | null
) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.requirement.findUnique({ where: { id }, select: { projectId: true, title: true } });
    if (!existing) throw new Error("Requirement not found");
    assertItemBelongsToProject(existing.projectId, projectId);

    const req = await prisma.requirement.update({
        where: { id },
        data: {
            title,
            description,
            priority: priority || "Normal",
            dueDate: dueDate ? new Date(dueDate) : null,
        },
    });

    await logActivity(projectId, user.id, `แก้ไขข้อมูล Requirement [${req.reqCode}]: "${title}"`, existing.title, title);
    revalidatePath(`/projects/${projectId}`);
}

export async function editUATCase(
    id: string,
    title: string,
    expectedResult: string,
    projectId: string,
    priority?: string,
    dueDate?: string | null
) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.uATCase.findUnique({ where: { id }, select: { projectId: true, title: true } });
    if (!existing) throw new Error("UAT Case not found");
    assertItemBelongsToProject(existing.projectId, projectId);

    const uat = await prisma.uATCase.update({
        where: { id },
        data: {
            title,
            expectedResult,
            priority: priority || "Normal",
            dueDate: dueDate ? new Date(dueDate) : null,
        },
    });

    await logActivity(projectId, user.id, `แก้ไขข้อมูล UAT Case [${uat.uatCode}]: "${title}"`, existing.title, title);
    revalidatePath(`/projects/${projectId}`);
}

export async function editIssue(
    id: string,
    title: string,
    stepsToReproduce: string,
    projectId: string,
    priority?: string,
    dueDate?: string | null
) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.issue.findUnique({ where: { id }, select: { projectId: true, title: true } });
    if (!existing) throw new Error("Issue not found");
    assertItemBelongsToProject(existing.projectId, projectId);

    const issue = await prisma.issue.update({
        where: { id },
        data: {
            title,
            stepsToReproduce,
            priority: priority || "Normal",
            dueDate: dueDate ? new Date(dueDate) : null,
        },
    });

    await logActivity(projectId, user.id, `แก้ไขข้อมูล Issue [${issue.issueCode}]: "${title}"`, existing.title, title);
    revalidatePath(`/projects/${projectId}`);
}

export async function editTask(
    id: string,
    title: string,
    description: string,
    projectId: string,
    dueDate?: string | null,
    estimatedHours?: number | null
) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.task.findUnique({ where: { id }, select: { projectId: true, title: true } });
    if (!existing) throw new Error("Task not found");
    assertItemBelongsToProject(existing.projectId, projectId);

    const task = await prisma.task.update({
        where: { id },
        data: {
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : null,
            estimatedHours: estimatedHours ?? null,
        },
    });

    await logActivity(projectId, user.id, `แก้ไขข้อมูล Task: "${title}"`, existing.title, title);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/tasks");
    return task;
}
