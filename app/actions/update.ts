"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateProjectProgress, logActivity } from "./progress";
import { getAuthUser } from "@/lib/auth";

// ==========================================
// 1. Toggle UAT Mandatory
// ==========================================
export async function toggleUatMandatory(uatId: string, currentStatus: boolean, projectId: string) {
    const user = await getAuthUser();

    const uat = await prisma.uATCase.update({
        where: { id: uatId },
        data: { isMandatory: !currentStatus }
    });

    if (user) {
        const statusText = !currentStatus ? "บังคับผ่าน" : "ทั่วไป";
        await logActivity(projectId, user.id, `ตั้งค่า UAT [${uat.uatCode}] เป็น "${statusText}"`);
    }

    revalidatePath(`/projects/${projectId}`);
}

// ==========================================
// 2. Update Requirement Status
// ==========================================
export async function updateRequirementStatus(reqId: string, newStatus: string, projectId: string) {
    const user = await getAuthUser();

    const req = await prisma.requirement.update({
        where: { id: reqId },
        data: { status: newStatus }
    });

    if (user) {
        await logActivity(projectId, user.id, `เปลี่ยนสถานะ Requirement [${req.reqCode}] เป็น "${newStatus}"`);
        await updateProjectProgress(projectId);
    }

    revalidatePath(`/projects/${projectId}`);
}

// ==========================================
// 3. Update UAT Status
// ==========================================
export async function updateUatStatus(uatId: string, newStatus: string, projectId: string) {
    const user = await getAuthUser();

    const uat = await prisma.uATCase.update({
        where: { id: uatId },
        data: { status: newStatus }
    });

    if (user) {
        await logActivity(projectId, user.id, `เปลี่ยนสถานะ UAT [${uat.uatCode}] เป็น "${newStatus}"`);
        await updateProjectProgress(projectId);
    }

    revalidatePath(`/projects/${projectId}`);
}

// ==========================================
// 4. Update Issue Status
// ==========================================
export async function updateIssueStatus(issueId: string, newStatus: string, projectId: string) {
    const user = await getAuthUser();

    const issue = await prisma.issue.update({
        where: { id: issueId },
        data: { status: newStatus }
    });

    if (user) {
        await logActivity(projectId, user.id, `อัปเดตสถานะ Issue [${issue.issueCode}] เป็น "${newStatus}"`);
        await updateProjectProgress(projectId);
    }

    revalidatePath(`/projects/${projectId}`);
}

// ==========================================
// 5. Bulk update status for Requirements / UATs / Issues
// ==========================================
export async function bulkUpdateRequirementStatus(ids: string[], newStatus: string, projectId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    if (user.role !== "ADMIN" && user.role !== "PM") {
        const unauthorizedItems = await prisma.requirement.count({
            where: { id: { in: ids }, assigneeId: { not: user.id } }
        });
        if (unauthorizedItems > 0) {
            return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะบางรายการ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
        }
    }

    await prisma.requirement.updateMany({ where: { id: { in: ids } }, data: { status: newStatus } });
    await updateProjectProgress(projectId);
    await logActivity(projectId, user.id, `Bulk อัปเดตสถานะ ${ids.length} Requirement(s) เป็น "${newStatus}"`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function bulkUpdateUatStatus(ids: string[], newStatus: string, projectId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    if (user.role !== "ADMIN" && user.role !== "PM") {
        const unauthorizedItems = await prisma.uATCase.count({
            where: { id: { in: ids }, assigneeId: { not: user.id } }
        });
        if (unauthorizedItems > 0) {
            return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะบางรายการ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
        }
    }

    await prisma.uATCase.updateMany({ where: { id: { in: ids } }, data: { status: newStatus } });
    await updateProjectProgress(projectId);
    await logActivity(projectId, user.id, `Bulk อัปเดตสถานะ ${ids.length} UAT Case(s) เป็น "${newStatus}"`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}

export async function bulkUpdateIssueStatus(ids: string[], newStatus: string, projectId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    if (user.role !== "ADMIN" && user.role !== "PM") {
        const unauthorizedItems = await prisma.issue.count({
            where: { id: { in: ids }, assigneeId: { not: user.id } }
        });
        if (unauthorizedItems > 0) {
            return { error: "คุณไม่มีสิทธิ์อัปเดตสถานะบางรายการ (ต้องเป็นผู้รับผิดชอบเท่านั้น)" };
        }
    }

    await prisma.issue.updateMany({ where: { id: { in: ids } }, data: { status: newStatus } });
    await updateProjectProgress(projectId);
    await logActivity(projectId, user.id, `Bulk อัปเดตสถานะ ${ids.length} Issue(s) เป็น "${newStatus}"`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}