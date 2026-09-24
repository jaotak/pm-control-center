"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logActivity, updateProjectProgress } from "@/lib/progress";
import { uploadFile } from "./upload";
import { requireProjectAccess } from "@/lib/auth";
import { generateNextCode } from "@/lib/codes";
import { createIssueRecord } from "@/lib/items";

async function uploadAttachments(files: File[]) {
    const uploaded = [];
    for (const file of files) {
        if (file && file.size > 0) {
            uploaded.push(await uploadFile(file));
        }
    }
    return uploaded;
}

export async function createUATCase(formData: FormData) {
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    const requirementId = formData.get("requirementId") as string;
    const assigneeId = formData.get("assigneeId") as string;
    const isMandatory = formData.get("isMandatory") === "on";
    const attachmentFiles = formData.getAll("attachments") as File[];

    const user = await requireProjectAccess(projectId, "manager");
    const uatCode = await generateNextCode(projectId, "UAT");
    const uploadedAttachments = await uploadAttachments(attachmentFiles);

    await prisma.uATCase.create({
        data: {
            uatCode,
            title,
            isMandatory,
            projectId,
            requirementId: requirementId || null,
            assigneeId: assigneeId || null,
            attachmentUrls: JSON.stringify(uploadedAttachments),
        },
    });

    await logActivity(projectId, user.id, `สร้าง UAT Case ใหม่ [${uatCode}]: "${title}"`);
    await updateProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    redirect(`/projects/${projectId}?tab=uat`);
}

export async function createRequirement(formData: FormData) {
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    const assigneeId = formData.get("assigneeId") as string;
    const attachmentFiles = formData.getAll("attachments") as File[];

    const user = await requireProjectAccess(projectId, "manager");
    const reqCode = await generateNextCode(projectId, "REQ");
    const uploadedAttachments = await uploadAttachments(attachmentFiles);

    await prisma.requirement.create({
        data: {
            reqCode,
            title,
            projectId,
            assigneeId: assigneeId || null,
            attachmentUrls: JSON.stringify(uploadedAttachments),
        },
    });

    await logActivity(projectId, user.id, `สร้าง Requirement ใหม่ [${reqCode}]: "${title}"`);
    await updateProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    redirect(`/projects/${projectId}?tab=requirements`);
}

export async function createIssue(formData: FormData) {
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    const severity = formData.get("severity") as string;
    const uatCaseId = formData.get("uatCaseId") as string;
    const assigneeId = formData.get("assigneeId") as string;
    const attachmentFiles = formData.getAll("attachments") as File[];

    if (!projectId || !title || !severity) {
        throw new Error("กรุณากรอกข้อมูลปัญหาให้ครบถ้วน");
    }

    const user = await requireProjectAccess(projectId, "manager");
    const uploadedAttachments = await uploadAttachments(attachmentFiles);

    await createIssueRecord({
        projectId,
        title,
        severity,
        uatCaseId: uatCaseId || null,
        assigneeId: assigneeId || null,
        attachmentUrls: uploadedAttachments,
        actorUserId: user.id,
    });

    revalidatePath(`/projects/${projectId}`);
    redirect(`/projects/${projectId}?tab=issues`);
}
