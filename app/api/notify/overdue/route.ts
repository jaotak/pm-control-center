import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/notify/overdue
 * Scans for overdue tasks and issues and creates notifications for their assignees.
 * Call from a cron job (e.g., daily via Vercel Cron / external scheduler).
 * Also callable manually by admins/PMs from the dashboard.
 */
export async function GET() {
    const user = await getAuthUser();
    if (!user || !["ADMIN", "PM"].includes(user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find overdue tasks with an assignee that haven't been notified (no existing unread notif with same link)
    const overdueTasks = await prisma.task.findMany({
        where: {
            isCompleted: false,
            deletedAt: null,
            dueDate: { lt: now },
            assigneeId: { not: null },
        },
        include: { project: { select: { id: true, code: true } } }
    });

    const overdueIssues = await prisma.issue.findMany({
        where: {
            status: { notIn: ["Resolved", "Closed"] },
            deletedAt: null,
            dueDate: { lt: now },
            assigneeId: { not: null },
        },
        include: { project: { select: { id: true, code: true } } }
    });

    let notifCount = 0;

    for (const task of overdueTasks) {
        if (!task.assigneeId) continue;
        const link = task.projectId ? `/projects/${task.projectId}?tab=tasks` : "/tasks";
        const existing = await prisma.notification.findFirst({
            where: { userId: task.assigneeId, link, isRead: false, title: "⚠️ Task เกินกำหนด" }
        });
        if (!existing) {
            await prisma.notification.create({
                data: {
                    userId: task.assigneeId,
                    title: "⚠️ Task เกินกำหนด",
                    message: `Task "${task.title}" เกินกำหนดส่งแล้ว (ครบกำหนด: ${task.dueDate!.toLocaleDateString("th-TH")})`,
                    link,
                }
            });
            notifCount++;
        }
    }

    for (const issue of overdueIssues) {
        if (!issue.assigneeId) continue;
        const link = `/projects/${issue.projectId}?tab=issues`;
        const existing = await prisma.notification.findFirst({
            where: { userId: issue.assigneeId, link, isRead: false, title: "🚨 Issue เกินกำหนด" }
        });
        if (!existing) {
            await prisma.notification.create({
                data: {
                    userId: issue.assigneeId,
                    title: "🚨 Issue เกินกำหนด",
                    message: `Issue [${issue.issueCode}] "${issue.title}" เกินกำหนดแก้ไข (${issue.dueDate!.toLocaleDateString("th-TH")})`,
                    link,
                }
            });
            notifCount++;
        }
    }

    return NextResponse.json({
        ok: true,
        scanned: { tasks: overdueTasks.length, issues: overdueIssues.length },
        notificationsSent: notifCount,
    });
}
