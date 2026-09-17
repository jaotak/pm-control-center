"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assertItemBelongsToProject, requireProjectAccess } from "@/lib/auth";

export async function createLabel(name: string, color: string, projectId: string) {
    await requireProjectAccess(projectId, "manager");

    await prisma.label.create({ data: { name, color, projectId } });
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteLabel(labelId: string, projectId: string) {
    await requireProjectAccess(projectId, "manager");
    const label = await prisma.label.findUnique({ where: { id: labelId }, select: { projectId: true } });
    if (!label) throw new Error("Label not found");
    assertItemBelongsToProject(label.projectId, projectId);
    await prisma.label.delete({ where: { id: labelId } });
    revalidatePath(`/projects/${projectId}`);
}

export async function toggleLabelOnItem(
    labelId: string,
    itemType: "req" | "uat" | "issue" | "task",
    itemId: string,
    projectId: string,
    isAttaching: boolean
) {
    await requireProjectAccess(projectId, "manager");
    const label = await prisma.label.findUnique({ where: { id: labelId }, select: { projectId: true } });
    if (!label) throw new Error("Label not found");
    assertItemBelongsToProject(label.projectId, projectId);
    const connectDisconnect = isAttaching
        ? { connect: { id: labelId } }
        : { disconnect: { id: labelId } };

    if (itemType === "req") {
        await prisma.requirement.update({ where: { id: itemId }, data: { labels: connectDisconnect } });
    } else if (itemType === "uat") {
        await prisma.uATCase.update({ where: { id: itemId }, data: { labels: connectDisconnect } });
    } else if (itemType === "issue") {
        await prisma.issue.update({ where: { id: itemId }, data: { labels: connectDisconnect } });
    } else if (itemType === "task") {
        await prisma.task.update({ where: { id: itemId }, data: { labels: connectDisconnect } });
    }

    revalidatePath(`/projects/${projectId}`);
}
