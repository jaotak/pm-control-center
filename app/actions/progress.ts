"use server";

import { prisma } from "@/lib/prisma";

export async function updateProjectProgress(projectId: string) {
    // ดึงข้อมูลงานทั้งหมดในโปรเจกต์ (กรองงานที่ถูกลบ soft-delete ออก)
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            requirements: { where: { deletedAt: null } },
            uatCases:     { where: { deletedAt: null } },
            tasks:        { where: { deletedAt: null } },
        }
    });

    if (!project) return;

    // นับจำนวนงานทั้งหมด และงานที่ "เสร็จแล้ว"
    const totalReqs       = project.requirements.length;
    const doneReqs        = project.requirements.filter(r => r.status === 'Done').length;
    const totalUATs       = project.uatCases.length;
    const passedUATs      = project.uatCases.filter(u => u.status === 'Passed').length;
    const totalTasks      = project.tasks.length;
    const completedTasks  = project.tasks.filter(t => t.isCompleted).length;

    const totalItems = totalReqs + totalUATs + totalTasks;
    let newProgress = 0;

    if (totalItems > 0) {
        const completedItems = doneReqs + passedUATs + completedTasks;
        newProgress = Math.round((completedItems / totalItems) * 100);
    }

    await prisma.project.update({
        where: { id: projectId },
        data: { progress: newProgress }
    });
}

// 🌟 ฟังก์ชันเสริมสำหรับบันทึก Activity Log
export async function logActivity(projectId: string, userId: string, action: string) {
    await prisma.activityLog.create({
        data: { projectId, userId, action }
    });
}