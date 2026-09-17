"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assertItemBelongsToProject, requireProjectAccess } from "@/lib/auth";

export async function createMilestone(
    name: string,
    startDate: string,
    endDate: string,
    projectId: string
) {
    await requireProjectAccess(projectId, "manager");

    await prisma.milestone.create({
        data: {
            name,
            projectId,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
        }
    });

    revalidatePath(`/projects/${projectId}`);
}

export async function updateMilestoneStatus(milestoneId: string, status: string, projectId: string) {
    await requireProjectAccess(projectId, "manager");
    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId }, select: { projectId: true } });
    if (!milestone) throw new Error("Milestone not found");
    assertItemBelongsToProject(milestone.projectId, projectId);

    await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status },
    });

    revalidatePath(`/projects/${projectId}`);
}

export async function deleteMilestone(milestoneId: string, projectId: string) {
    await requireProjectAccess(projectId, "manager");
    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId }, select: { projectId: true } });
    if (!milestone) throw new Error("Milestone not found");
    assertItemBelongsToProject(milestone.projectId, projectId);
    // Unlink all items first
    await prisma.requirement.updateMany({ where: { milestoneId }, data: { milestoneId: null } });
    await prisma.uATCase.updateMany({ where: { milestoneId }, data: { milestoneId: null } });
    await prisma.issue.updateMany({ where: { milestoneId }, data: { milestoneId: null } });
    await prisma.task.updateMany({ where: { milestoneId }, data: { milestoneId: null } });

    await prisma.milestone.delete({ where: { id: milestoneId } });
    revalidatePath(`/projects/${projectId}`);
}

export async function assignItemToMilestone(
    milestoneId: string | null,
    itemType: "req" | "uat" | "issue" | "task",
    itemId: string,
    projectId: string
) {
    await requireProjectAccess(projectId, "manager");
    if (milestoneId) {
        const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId }, select: { projectId: true } });
        if (!milestone) throw new Error("Milestone not found");
        assertItemBelongsToProject(milestone.projectId, projectId);
    }
    if (itemType === "req") {
        await prisma.requirement.update({ where: { id: itemId }, data: { milestoneId } });
    } else if (itemType === "uat") {
        await prisma.uATCase.update({ where: { id: itemId }, data: { milestoneId } });
    } else if (itemType === "issue") {
        await prisma.issue.update({ where: { id: itemId }, data: { milestoneId } });
    } else if (itemType === "task") {
        await prisma.task.update({ where: { id: itemId }, data: { milestoneId } });
    }

    revalidatePath(`/projects/${projectId}`);
}
