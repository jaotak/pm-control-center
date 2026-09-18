"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity, updateProjectProgress } from "@/lib/progress";
import { assertAssigneeOrManager, assertItemBelongsToProject, requireProjectAccess } from "@/lib/auth";
import { assertAllowedStatus } from "@/lib/itemStatus";
import { sendNotification } from "@/lib/notifications";

type ActionResult = { success?: true; error?: string };

function asError(e: unknown): ActionResult {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
}

export async function toggleUatMandatory(uatId: string, currentStatus: boolean, projectId: string) {
    const user = await requireProjectAccess(projectId, "manager");

    const uat = await prisma.uATCase.update({
        where: { id: uatId, projectId },
        data: { isMandatory: !currentStatus },
    });

    const statusText = !currentStatus ? "บังคับผ่าน" : "ทั่วไป";
    await logActivity(projectId, user.id, `ตั้งค่า UAT [${uat.uatCode}] เป็น "${statusText}"`);

    revalidatePath(`/projects/${projectId}`);
}

export async function updateRequirementStatus(reqId: string, newStatus: string, projectId: string): Promise<ActionResult> {
    try {
        assertAllowedStatus("req", newStatus);
        const user = await requireProjectAccess(projectId);

        const existing = await prisma.requirement.findUnique({
            where: { id: reqId },
            select: { projectId: true, assigneeId: true, status: true, reqCode: true, title: true },
        });
        if (!existing) return { error: "Requirement not found" };
        assertItemBelongsToProject(existing.projectId, projectId);
        assertAssigneeOrManager(user, existing.assigneeId);

        const req = await prisma.requirement.update({
            where: { id: reqId },
            data: { status: newStatus },
        });

        await logActivity(
            projectId,
            user.id,
            `เปลี่ยนสถานะ Requirement [${req.reqCode}] เป็น "${newStatus}"`,
            existing.status,
            newStatus
        );
        await updateProjectProgress(projectId);

        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
        if (newStatus === "In Review" && project?.ownerId && project.ownerId !== user.id) {
            await sendNotification(
                project.ownerId,
                "Requirement Ready for Review",
                `[${req.reqCode}] "${req.title}" ถูกส่งมาเพื่อรออนุมัติ`,
                `/projects/${projectId}?tab=requirements`
            );
        }
        if ((newStatus === "Approved" || (newStatus === "Draft" && existing.status === "In Review")) && req.assigneeId && req.assigneeId !== user.id) {
            await sendNotification(
                req.assigneeId,
                newStatus === "Approved" ? "Requirement Approved" : "Requirement Returned for Revision",
                `[${req.reqCode}] "${req.title}" ${newStatus === "Approved" ? "ได้รับการอนุมัติแล้ว" : "ถูกส่งกลับเพื่อแก้ไข"}`,
                `/projects/${projectId}?tab=requirements`
            );
        }

        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        return asError(e);
    }
}

export async function updateUatStatus(uatId: string, newStatus: string, projectId: string): Promise<ActionResult> {
    try {
        assertAllowedStatus("uat", newStatus);
        const user = await requireProjectAccess(projectId);

        const existing = await prisma.uATCase.findUnique({
            where: { id: uatId },
            select: { projectId: true, assigneeId: true, status: true, uatCode: true },
        });
        if (!existing) return { error: "UAT Case not found" };
        assertItemBelongsToProject(existing.projectId, projectId);
        assertAssigneeOrManager(user, existing.assigneeId);

        const uat = await prisma.uATCase.update({
            where: { id: uatId },
            data: { status: newStatus },
        });

        await logActivity(
            projectId,
            user.id,
            `เปลี่ยนสถานะ UAT [${uat.uatCode}] เป็น "${newStatus}"`,
            existing.status,
            newStatus
        );
        await updateProjectProgress(projectId);
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        return asError(e);
    }
}

export async function updateIssueStatus(issueId: string, newStatus: string, projectId: string): Promise<ActionResult> {
    try {
        assertAllowedStatus("issue", newStatus);
        const user = await requireProjectAccess(projectId);

        const existing = await prisma.issue.findUnique({
            where: { id: issueId },
            select: { projectId: true, assigneeId: true, status: true, issueCode: true },
        });
        if (!existing) return { error: "Issue not found" };
        assertItemBelongsToProject(existing.projectId, projectId);
        assertAssigneeOrManager(user, existing.assigneeId);

        const issue = await prisma.issue.update({
            where: { id: issueId },
            data: { status: newStatus },
        });

        await logActivity(
            projectId,
            user.id,
            `อัปเดตสถานะ Issue [${issue.issueCode}] เป็น "${newStatus}"`,
            existing.status,
            newStatus
        );
        await updateProjectProgress(projectId);
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        return asError(e);
    }
}

export async function bulkUpdateRequirementStatus(ids: string[], newStatus: string, projectId: string) {
    try {
        assertAllowedStatus("req", newStatus);
        const user = await requireProjectAccess(projectId);

        if (user.role !== "ADMIN" && user.role !== "PM") {
            const unauthorizedItems = await prisma.requirement.count({
                where: { id: { in: ids }, projectId, assigneeId: { not: user.id } },
            });
            if (unauthorizedItems > 0) {
                return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะบางรายการ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
            }
        }

        await prisma.requirement.updateMany({ where: { id: { in: ids }, projectId }, data: { status: newStatus } });
        await updateProjectProgress(projectId);
        await logActivity(projectId, user.id, `Bulk อัปเดตสถานะ ${ids.length} Requirement(s) เป็น "${newStatus}"`);
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        return asError(e);
    }
}

export async function bulkUpdateUatStatus(ids: string[], newStatus: string, projectId: string) {
    try {
        assertAllowedStatus("uat", newStatus);
        const user = await requireProjectAccess(projectId);

        if (user.role !== "ADMIN" && user.role !== "PM") {
            const unauthorizedItems = await prisma.uATCase.count({
                where: { id: { in: ids }, projectId, assigneeId: { not: user.id } },
            });
            if (unauthorizedItems > 0) {
                return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะบางรายการ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
            }
        }

        await prisma.uATCase.updateMany({ where: { id: { in: ids }, projectId }, data: { status: newStatus } });
        await updateProjectProgress(projectId);
        await logActivity(projectId, user.id, `Bulk อัปเดตสถานะ ${ids.length} UAT Case(s) เป็น "${newStatus}"`);
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        return asError(e);
    }
}

export async function bulkUpdateIssueStatus(ids: string[], newStatus: string, projectId: string) {
    try {
        assertAllowedStatus("issue", newStatus);
        const user = await requireProjectAccess(projectId);

        if (user.role !== "ADMIN" && user.role !== "PM") {
            const unauthorizedItems = await prisma.issue.count({
                where: { id: { in: ids }, projectId, assigneeId: { not: user.id } },
            });
            if (unauthorizedItems > 0) {
                return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะบางรายการ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
            }
        }

        await prisma.issue.updateMany({ where: { id: { in: ids }, projectId }, data: { status: newStatus } });
        await updateProjectProgress(projectId);
        await logActivity(projectId, user.id, `Bulk อัปเดตสถานะ ${ids.length} Issue(s) เป็น "${newStatus}"`);
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (e) {
        return asError(e);
    }
}

export async function linkRequirementToUat(uatId: string, requirementId: string | null, projectId: string) {
    const user = await requireProjectAccess(projectId, "manager");
    const uat = await prisma.uATCase.findUnique({ where: { id: uatId }, select: { projectId: true, uatCode: true } });
    if (!uat) throw new Error("UAT Case not found");
    assertItemBelongsToProject(uat.projectId, projectId);

    if (requirementId) {
        const req = await prisma.requirement.findUnique({ where: { id: requirementId }, select: { projectId: true, reqCode: true } });
        if (!req) throw new Error("Requirement not found");
        assertItemBelongsToProject(req.projectId, projectId);
        await prisma.uATCase.update({ where: { id: uatId }, data: { requirementId } });
        await logActivity(projectId, user.id, `ผูก UAT [${uat.uatCode}] กับ Requirement [${req.reqCode}]`);
    } else {
        await prisma.uATCase.update({ where: { id: uatId }, data: { requirementId: null } });
        await logActivity(projectId, user.id, `ยกเลิกการผูก Requirement ของ UAT [${uat.uatCode}]`);
    }

    revalidatePath(`/projects/${projectId}`);
}

export async function linkUatToIssue(issueId: string, uatCaseId: string | null, projectId: string) {
    const user = await requireProjectAccess(projectId, "manager");
    const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { projectId: true, issueCode: true } });
    if (!issue) throw new Error("Issue not found");
    assertItemBelongsToProject(issue.projectId, projectId);

    if (uatCaseId) {
        const uat = await prisma.uATCase.findUnique({ where: { id: uatCaseId }, select: { projectId: true, uatCode: true } });
        if (!uat) throw new Error("UAT Case not found");
        assertItemBelongsToProject(uat.projectId, projectId);
        await prisma.issue.update({ where: { id: issueId }, data: { uatCaseId } });
        await logActivity(projectId, user.id, `ผูก Issue [${issue.issueCode}] กับ UAT [${uat.uatCode}]`);
    } else {
        await prisma.issue.update({ where: { id: issueId }, data: { uatCaseId: null } });
        await logActivity(projectId, user.id, `ยกเลิกการผูก UAT ของ Issue [${issue.issueCode}]`);
    }

    revalidatePath(`/projects/${projectId}`);
}
