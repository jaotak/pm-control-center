import { prisma } from "@/lib/prisma";

export async function updateProjectProgress(projectId: string) {
    const [
        totalReqs, doneReqs,
        totalUATs, passedUATs,
        totalTasks, completedTasks,
        totalIssues, resolvedIssues,
    ] = await Promise.all([
        prisma.requirement.count({ where: { projectId, deletedAt: null } }),
        prisma.requirement.count({ where: { projectId, deletedAt: null, status: "Done" } }),
        prisma.uATCase.count({ where: { projectId, deletedAt: null } }),
        prisma.uATCase.count({ where: { projectId, deletedAt: null, status: "Passed" } }),
        prisma.task.count({ where: { projectId, deletedAt: null } }),
        prisma.task.count({ where: { projectId, deletedAt: null, isCompleted: true } }),
        prisma.issue.count({ where: { projectId, deletedAt: null } }),
        prisma.issue.count({ where: { projectId, deletedAt: null, status: { in: ["Resolved", "Closed"] } } }),
    ]);

    const totalItems = totalReqs + totalUATs + totalTasks + totalIssues;
    const completedItems = doneReqs + passedUATs + completedTasks + resolvedIssues;
    const newProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    await prisma.project.update({
        where: { id: projectId },
        data: { progress: newProgress },
    });
}

export async function logActivity(
    projectId: string,
    userId: string,
    action: string,
    beforeState?: string | null,
    afterState?: string | null
) {
    await prisma.activityLog.create({
        data: {
            projectId,
            userId,
            action,
            beforeState: beforeState ?? null,
            afterState: afterState ?? null,
        },
    });
}
