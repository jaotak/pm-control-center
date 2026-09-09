"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";

export async function createMilestone(
    name: string,
    startDate: string,
    endDate: string,
    projectId: string
) {
    const user = await getAuthUser();
    if (!user) return;

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
    const user = await getAuthUser();
    if (!user) return;

    await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status },
    });

    revalidatePath(`/projects/${projectId}`);
}

export async function deleteMilestone(milestoneId: string, projectId: string) {
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
