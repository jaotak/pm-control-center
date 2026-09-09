"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { logActivity } from "./progress";

export async function submitRequirementForReview(reqId: string, projectId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const req = await prisma.requirement.update({
        where: { id: reqId },
        data: { status: "In Review" }
    });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project?.ownerId) {
        await prisma.notification.create({
            data: {
                userId: project.ownerId,
                title: "Requirement Ready for Review",
                message: `[${req.reqCode}] "${req.title}" ถูกส่งมาเพื่อรออนุมัติ`,
                link: `/projects/${projectId}?tab=requirements`
            }
        });
    }

    await logActivity(projectId, user.id, `ส่ง Requirement [${req.reqCode}] เพื่อขออนุมัติ (In Review)`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function approveRequirement(reqId: string, projectId: string) {
    const user = await getAuthUser();
    if (!user || !["PM", "ADMIN"].includes(user.role)) return { error: "Unauthorized" };

    const req = await prisma.requirement.update({
        where: { id: reqId },
        data: { status: "Approved" },
        include: { assignee: true }
    });

    if (req.assigneeId) {
        await prisma.notification.create({
            data: {
                userId: req.assigneeId,
                title: "Requirement Approved",
                message: `[${req.reqCode}] "${req.title}" ได้รับการอนุมัติแล้ว`,
                link: `/projects/${projectId}?tab=requirements`
            }
        });
    }

    await logActivity(projectId, user.id, `อนุมัติ Requirement [${req.reqCode}]: "${req.title}"`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function rejectRequirement(reqId: string, projectId: string) {
    const user = await getAuthUser();
    if (!user || !["PM", "ADMIN"].includes(user.role)) return { error: "Unauthorized" };

    const req = await prisma.requirement.update({
        where: { id: reqId },
        data: { status: "Draft" }
    });

    if (req.assigneeId) {
        await prisma.notification.create({
            data: {
                userId: req.assigneeId,
                title: "Requirement Returned for Revision",
                message: `[${req.reqCode}] "${req.title}" ถูกส่งกลับเพื่อแก้ไข`,
                link: `/projects/${projectId}?tab=requirements`
            }
        });
    }

    await logActivity(projectId, user.id, `ส่งกลับ Requirement [${req.reqCode}] เพื่อแก้ไข`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
