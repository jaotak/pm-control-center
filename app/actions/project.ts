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

    // Complete cascade delete — all child records in correct order
    // First: delete items with deep dependencies
    await prisma.comment.deleteMany({
        where: {
            OR: [
                { itemType: "req",   itemId: { in: (await prisma.requirement.findMany({ where: { projectId }, select: { id: true } })).map(r => r.id) } },
                { itemType: "uat",   itemId: { in: (await prisma.uATCase.findMany({ where: { projectId }, select: { id: true } })).map(u => u.id) } },
                { itemType: "issue", itemId: { in: (await prisma.issue.findMany({ where: { projectId }, select: { id: true } })).map(i => i.id) } },
                { itemType: "task",  itemId: { in: (await prisma.task.findMany({ where: { projectId }, select: { id: true } })).map(t => t.id) } },
            ]
        }
    });

    // Then: delete child entities
    await prisma.notification.deleteMany({
        where: { link: { contains: projectId } }
    });
    await prisma.task.deleteMany({ where: { projectId } });
    await prisma.issue.deleteMany({ where: { projectId } });
    await prisma.uATCase.deleteMany({ where: { projectId } });
    await prisma.requirement.deleteMany({ where: { projectId } });

    // Models with onDelete: Cascade will auto-delete:
    // - ActivityLog, Label, Milestone, Attachment
    // But explicitly delete them to be safe with SQLite
    await prisma.activityLog.deleteMany({ where: { projectId } });
    await prisma.label.deleteMany({ where: { projectId } });
    await prisma.milestone.deleteMany({ where: { projectId } });
    await prisma.attachment.deleteMany({ where: { projectId } });

    // Finally: delete the project
    await prisma.project.delete({ where: { id: projectId } });

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