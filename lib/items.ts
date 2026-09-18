import { prisma } from "@/lib/prisma";
import { generateNextCode } from "@/lib/codes";
import { logActivity, updateProjectProgress } from "@/lib/progress";

type Attachment = { name: string; url: string; type?: string; size?: number };

export async function createIssueRecord(input: {
    projectId: string;
    title: string;
    severity?: string;
    uatCaseId?: string | null;
    assigneeId?: string | null;
    attachmentUrls?: Attachment[];
    actorUserId: string;
}) {
    const issueCode = await generateNextCode(input.projectId, "ISSUE");
    const issue = await prisma.issue.create({
        data: {
            issueCode,
            title: input.title,
            severity: input.severity || "Medium",
            status: "Open",
            projectId: input.projectId,
            uatCaseId: input.uatCaseId || null,
            assigneeId: input.assigneeId || null,
            attachmentUrls: JSON.stringify(input.attachmentUrls ?? []),
        },
    });
    await logActivity(input.projectId, input.actorUserId, `สร้าง Issue ใหม่ [${issue.issueCode}]: "${issue.title}"`);
    await updateProjectProgress(input.projectId);
    return issue;
}

export async function createTaskRecord(input: {
    projectId: string;
    title: string;
    estimatedHours?: number | null;
    actorUserId: string;
    assigneeId?: string | null;
}) {
    const task = await prisma.task.create({
        data: {
            title: input.title,
            estimatedHours: input.estimatedHours ?? 0,
            projectId: input.projectId,
            isCompleted: false,
            assigneeId: input.assigneeId ?? input.actorUserId,
        },
    });
    await logActivity(input.projectId, input.actorUserId, `สร้าง Task ใหม่: ${task.title}`);
    await updateProjectProgress(input.projectId);
    return task;
}
