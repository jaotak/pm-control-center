"use server";

import { prisma } from "@/lib/prisma";

export async function updateProjectProgress(projectId: string) {
    // Use count queries instead of fetching all records into memory
    const [totalReqs, doneReqs, totalUATs, passedUATs, totalTasks, completedTasks] = await Promise.all([
        prisma.requirement.count({ where: { projectId, deletedAt: null } }),
        prisma.requirement.count({ where: { projectId, deletedAt: null, status: 'Done' } }),
        prisma.uATCase.count({ where: { projectId, deletedAt: null } }),
        prisma.uATCase.count({ where: { projectId, deletedAt: null, status: 'Passed' } }),
        prisma.task.count({ where: { projectId, deletedAt: null } }),
        prisma.task.count({ where: { projectId, deletedAt: null, isCompleted: true } }),
    ]);

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