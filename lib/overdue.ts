import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

export async function scanOverdueItems() {
    const now = new Date();

    const [overdueTasks, overdueIssues, overdueReqs, overdueUats] = await Promise.all([
        prisma.task.findMany({
            where: { isCompleted: false, deletedAt: null, dueDate: { lt: now }, assigneeId: { not: null } },
            select: { id: true, title: true, dueDate: true, assigneeId: true, projectId: true },
        }),
        prisma.issue.findMany({
            where: { status: { notIn: ["Resolved", "Closed"] }, deletedAt: null, dueDate: { lt: now }, assigneeId: { not: null } },
            select: { id: true, title: true, issueCode: true, dueDate: true, assigneeId: true, projectId: true },
        }),
        prisma.requirement.findMany({
            where: { status: { notIn: ["Done", "Approved"] }, deletedAt: null, dueDate: { lt: now }, assigneeId: { not: null } },
            select: { id: true, title: true, reqCode: true, dueDate: true, assigneeId: true, projectId: true },
        }),
        prisma.uATCase.findMany({
            where: { status: { notIn: ["Passed"] }, deletedAt: null, dueDate: { lt: now }, assigneeId: { not: null } },
            select: { id: true, title: true, uatCode: true, dueDate: true, assigneeId: true, projectId: true },
        }),
    ]);

    const pending = [
        ...overdueTasks.map((t) => ({
            userId: t.assigneeId!,
            title: "⚠️ Task เกินกำหนด",
            message: `Task "${t.title}" เกินกำหนดส่งแล้ว (ครบกำหนด: ${t.dueDate!.toLocaleDateString("th-TH")})`,
            link: t.projectId ? `/projects/${t.projectId}?tab=tasks` : "/tasks",
        })),
        ...overdueIssues.map((i) => ({
            userId: i.assigneeId!,
            title: "🚨 Issue เกินกำหนด",
            message: `Issue [${i.issueCode}] "${i.title}" เกินกำหนดแก้ไข (${i.dueDate!.toLocaleDateString("th-TH")})`,
            link: `/projects/${i.projectId}?tab=issues`,
        })),
        ...overdueReqs.map((r) => ({
            userId: r.assigneeId!,
            title: "⚠️ Requirement เกินกำหนด",
            message: `[${r.reqCode}] "${r.title}" เกินกำหนด (${r.dueDate!.toLocaleDateString("th-TH")})`,
            link: `/projects/${r.projectId}?tab=requirements`,
        })),
        ...overdueUats.map((u) => ({
            userId: u.assigneeId!,
            title: "⚠️ UAT เกินกำหนด",
            message: `[${u.uatCode}] "${u.title}" เกินกำหนดทดสอบ (${u.dueDate!.toLocaleDateString("th-TH")})`,
            link: `/projects/${u.projectId}?tab=uat`,
        })),
    ];

    const links = [...new Set(pending.map((p) => p.link))];
    const existing = await prisma.notification.findMany({
        where: {
            isRead: false,
            link: { in: links },
            title: { in: [...new Set(pending.map((p) => p.title))] },
        },
        select: { userId: true, link: true, title: true },
    });
    const existingKeys = new Set(existing.map((n) => `${n.userId}|${n.link}|${n.title}`));

    let notificationsSent = 0;
    for (const item of pending) {
        const key = `${item.userId}|${item.link}|${item.title}`;
        if (existingKeys.has(key)) continue;
        await sendNotification(item.userId, item.title, item.message, item.link);
        existingKeys.add(key);
        notificationsSent++;
    }

    return {
        scanned: {
            tasks: overdueTasks.length,
            issues: overdueIssues.length,
            requirements: overdueReqs.length,
            uats: overdueUats.length,
        },
        notificationsSent,
    };
}
