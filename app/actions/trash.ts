"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { logActivity } from "./progress";

type ItemType = "req" | "uat" | "issue" | "task";

/** Restore a soft-deleted item by clearing its deletedAt timestamp */
export async function restoreItem(id: string, type: ItemType, projectId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const now = { deletedAt: null };

    let title = "";
    if (type === "req") {
        const r = await prisma.requirement.update({ where: { id }, data: now });
        title = `[${r.reqCode}] ${r.title}`;
    } else if (type === "uat") {
        const u = await prisma.uATCase.update({ where: { id }, data: now });
        title = `[${u.uatCode}] ${u.title}`;
    } else if (type === "issue") {
        const i = await prisma.issue.update({ where: { id }, data: now });
        title = `[${i.issueCode}] ${i.title}`;
    } else if (type === "task") {
        const t = await prisma.task.update({ where: { id }, data: now });
        title = t.title;
    }

    await logActivity(projectId, user.id, `กู้คืน ${type.toUpperCase()} จากถังขยะ: ${title}`);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/trash`);
    return { success: true };
}

/** Permanently delete a soft-deleted item (no recovery) */
export async function permanentlyDelete(id: string, type: ItemType, projectId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    if (type === "req") {
        // Cascade: delete linked UATs and their issues
        const uats = await prisma.uATCase.findMany({ where: { requirementId: id } });
        const uatIds = uats.map(u => u.id);
        await prisma.issue.deleteMany({ where: { uatCaseId: { in: uatIds } } });
        await prisma.uATCase.deleteMany({ where: { requirementId: id } });
        await prisma.requirement.delete({ where: { id } });
    } else if (type === "uat") {
        await prisma.issue.deleteMany({ where: { uatCaseId: id } });
        await prisma.uATCase.delete({ where: { id } });
    } else if (type === "issue") {
        await prisma.issue.delete({ where: { id } });
    } else if (type === "task") {
        await prisma.task.delete({ where: { id } });
    }

    await logActivity(projectId, user.id, `ลบ ${type.toUpperCase()} ถาวรจากถังขยะ`);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/trash`);
    return { success: true };
}
