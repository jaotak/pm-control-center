"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assertItemBelongsToProject, requireProjectAccess } from "@/lib/auth";
import { logActivity } from "@/lib/progress";
import { sendNotification } from "@/lib/notifications";

export async function submitRequirementForReview(reqId: string, projectId: string) {
    const user = await requireProjectAccess(projectId);
    const existing = await prisma.requirement.findUnique({ where: { id: reqId }, select: { projectId: true, assigneeId: true } });
    if (!existing) return { error: "Requirement not found" };
    assertItemBelongsToProject(existing.projectId, projectId);
    if (user.role === "DEV" && existing.assigneeId !== user.id) return { error: "Forbidden" };

    const req = await prisma.requirement.update({
        where: { id: reqId },
        data: { status: "In Review" },
    });

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (project?.ownerId && project.ownerId !== user.id) {
        await sendNotification(
            project.ownerId,
            "Requirement Ready for Review",
            `[${req.reqCode}] "${req.title}" ถูกส่งมาเพื่อรออนุมัติ`,
            `/projects/${projectId}?tab=requirements`
        );
    }

    await logActivity(projectId, user.id, `ส่ง Requirement [${req.reqCode}] เพื่อขออนุมัติ (In Review)`, existing.assigneeId, "In Review");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function approveRequirement(reqId: string, projectId: string) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.requirement.findUnique({ where: { id: reqId }, select: { projectId: true } });
    if (!existing) return { error: "Requirement not found" };
    assertItemBelongsToProject(existing.projectId, projectId);

    const req = await prisma.requirement.update({
        where: { id: reqId },
        data: { status: "Approved" },
    });

    if (req.assigneeId && req.assigneeId !== user.id) {
        await sendNotification(
            req.assigneeId,
            "Requirement Approved",
            `[${req.reqCode}] "${req.title}" ได้รับการอนุมัติแล้ว`,
            `/projects/${projectId}?tab=requirements`
        );
    }

    await logActivity(projectId, user.id, `อนุมัติ Requirement [${req.reqCode}]: "${req.title}"`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function rejectRequirement(reqId: string, projectId: string) {
    const user = await requireProjectAccess(projectId, "manager");
    const existing = await prisma.requirement.findUnique({ where: { id: reqId }, select: { projectId: true } });
    if (!existing) return { error: "Requirement not found" };
    assertItemBelongsToProject(existing.projectId, projectId);

    const req = await prisma.requirement.update({
        where: { id: reqId },
        data: { status: "Draft" },
    });

    if (req.assigneeId && req.assigneeId !== user.id) {
        await sendNotification(
            req.assigneeId,
            "Requirement Returned for Revision",
            `[${req.reqCode}] "${req.title}" ถูกส่งกลับเพื่อแก้ไข`,
            `/projects/${projectId}?tab=requirements`
        );
    }

    await logActivity(projectId, user.id, `ส่งกลับ Requirement [${req.reqCode}] เพื่อแก้ไข`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
