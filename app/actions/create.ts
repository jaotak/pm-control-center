"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateProjectProgress, logActivity } from "./progress";
import { uploadFile } from "./upload";

// ฟังก์ชันสร้าง UAT Case
export async function createUATCase(formData: FormData) {
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    const requirementId = formData.get("requirementId") as string;
    const assigneeId = formData.get("assigneeId") as string;
    const isMandatory = formData.get("isMandatory") === "on"; // Checkbox
    const attachmentFiles = formData.getAll("attachments") as File[];

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    // ระบบ Auto-Generate รหัส (เช่น UAT-001)
    const count = await prisma.uATCase.count({ where: { projectId } });
    const uatCode = `UAT-${String(count + 1).padStart(3, '0')}`;

    const uploadedAttachments = [];
    for (const file of attachmentFiles) {
        if (file && file.size > 0) {
            const uploaded = await uploadFile(file);
            uploadedAttachments.push(uploaded);
        }
    }

    await prisma.uATCase.create({
        data: {
            uatCode,
            title,
            isMandatory,
            projectId,
            requirementId: requirementId || null,
            assigneeId: assigneeId || null,
            attachmentUrls: JSON.stringify(uploadedAttachments)
        }
    });

    if (userId) {
        await logActivity(projectId, userId, `สร้าง UAT Case ใหม่ [${uatCode}]: "${title}"`);
    }

    await updateProjectProgress(projectId);
    redirect(`/projects/${projectId}?tab=uat`);
}

// ฟังก์ชันสร้าง Requirement
export async function createRequirement(formData: FormData) {
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    const assigneeId = formData.get("assigneeId") as string;
    const attachmentFiles = formData.getAll("attachments") as File[];

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const count = await prisma.requirement.count({ where: { projectId } });
    const reqCode = `REQ-${String(count + 1).padStart(3, '0')}`;

    const uploadedAttachments = [];
    for (const file of attachmentFiles) {
        if (file && file.size > 0) {
            const uploaded = await uploadFile(file);
            uploadedAttachments.push(uploaded);
        }
    }

    await prisma.requirement.create({
        data: { reqCode, title, projectId, assigneeId: assigneeId || null, attachmentUrls: JSON.stringify(uploadedAttachments) }
    });

    if (userId) {
        await logActivity(projectId, userId, `สร้าง Requirement ใหม่ [${reqCode}]: "${title}"`);
    }

    await updateProjectProgress(projectId);
    redirect(`/projects/${projectId}?tab=requirements`);
}