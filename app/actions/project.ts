"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// 1. ฟังก์ชันสำหรับลบโปรเจกต์ (มีอยู่เดิม)
// ==========================================
export async function deleteProject(projectId: string) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    // Verify ownership or admin role
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true }
    });
    if (!project) throw new Error("Project not found");
    if (user.role !== "ADMIN" && project.ownerId !== user.id) {
        throw new Error("คุณไม่มีสิทธิ์ลบโปรเจกต์นี้");
    }

    // Fetch all child IDs in parallel (instead of sequentially inside the deleteMany)
    const [reqIds, uatIds, issueIds, taskIds] = await Promise.all([
        prisma.requirement.findMany({ where: { projectId }, select: { id: true } }).then(r => r.map(x => x.id)),
        prisma.uATCase.findMany({ where: { projectId }, select: { id: true } }).then(r => r.map(x => x.id)),
        prisma.issue.findMany({ where: { projectId }, select: { id: true } }).then(r => r.map(x => x.id)),
        prisma.task.findMany({ where: { projectId }, select: { id: true } }).then(r => r.map(x => x.id)),
    ]);

    // Batch all deletes in a single transaction
    await prisma.$transaction([
        // Comments referencing any child entity
        prisma.comment.deleteMany({
            where: {
                OR: [
                    { itemType: "req",   itemId: { in: reqIds } },
                    { itemType: "uat",   itemId: { in: uatIds } },
                    { itemType: "issue", itemId: { in: issueIds } },
                    { itemType: "task",  itemId: { in: taskIds } },
                ]
            }
        }),
        // Notifications
        prisma.notification.deleteMany({ where: { link: { contains: projectId } } }),
        // Child entities
        prisma.task.deleteMany({ where: { projectId } }),
        prisma.issue.deleteMany({ where: { projectId } }),
        prisma.uATCase.deleteMany({ where: { projectId } }),
        prisma.requirement.deleteMany({ where: { projectId } }),
        // Cascade-safe models
        prisma.activityLog.deleteMany({ where: { projectId } }),
        prisma.label.deleteMany({ where: { projectId } }),
        prisma.milestone.deleteMany({ where: { projectId } }),
        prisma.attachment.deleteMany({ where: { projectId } }),
        // The project itself
        prisma.project.delete({ where: { id: projectId } }),
    ]);

    revalidatePath("/");
    revalidatePath("/projects");
    redirect("/projects");
}

// ==========================================
// 2. ฟังก์ชันสำหรับเปลี่ยนสถานะ (ระบบ Quality Gate)
// ==========================================
export async function updateProjectStage(projectId: string, newStage: string) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    // Verify ownership or admin/PM role
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true }
    });
    if (!project) throw new Error("Project not found");
    if (user.role === "DEV" && project.ownerId !== user.id) {
        return { success: false, error: "คุณไม่มีสิทธิ์เปลี่ยนสถานะโครงการนี้" };
    }

    // Quality Gate: ถ้าจะเปลี่ยนเป็น Delivery หรือ Completed ต้องเช็ค Mandatory UAT ก่อน
    if (newStage === "Delivery" || newStage === "Completed") {
        const pendingMandatoryUATs = await prisma.uATCase.count({
            where: {
                projectId: projectId,
                isMandatory: true,
                status: { not: "Passed" },
                deletedAt: null
            }
        });

        if (pendingMandatoryUATs > 0) {
            return {
                success: false,
                error: `ปฏิเสธการอัปเดตสถานะ! มี UAT "บังคับผ่าน" จำนวน ${pendingMandatoryUATs} รายการ ที่ยังไม่ผ่านการทดสอบ (Passed)`
            };
        }
    }

    await prisma.project.update({
        where: { id: projectId },
        data: { stage: newStage }
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
    revalidatePath("/projects");

    return { success: true };
}
