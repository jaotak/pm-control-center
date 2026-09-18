"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireProjectAccess } from "@/lib/auth";
import { notifyMentionedUsers } from "@/lib/notifications";

const ITEM_TYPES = ["req", "uat", "issue", "task"] as const;
type CommentItemType = (typeof ITEM_TYPES)[number];

async function loadTarget(itemType: string, itemId: string) {
    if (itemType === "req") return prisma.requirement.findUnique({ where: { id: itemId }, select: { projectId: true, title: true, reqCode: true } });
    if (itemType === "uat") return prisma.uATCase.findUnique({ where: { id: itemId }, select: { projectId: true, title: true, uatCode: true } });
    if (itemType === "issue") return prisma.issue.findUnique({ where: { id: itemId }, select: { projectId: true, title: true, issueCode: true } });
    if (itemType === "task") return prisma.task.findUnique({ where: { id: itemId }, select: { projectId: true, title: true } });
    return null;
}

function itemLabel(itemType: string, item: { title: string; reqCode?: string; uatCode?: string; issueCode?: string }) {
    const code = "reqCode" in item && item.reqCode
        ? item.reqCode
        : "uatCode" in item && item.uatCode
            ? item.uatCode
            : "issueCode" in item && item.issueCode
                ? item.issueCode
                : itemType.toUpperCase();
    return `[${code}] ${item.title}`;
}

export async function addComment(
    itemType: string,
    itemId: string,
    body: string,
    projectId: string,
    parentId?: string
) {
    const user = await requireProjectAccess(projectId);
    if (!body.trim()) return { error: "Comment cannot be empty" };
    if (!ITEM_TYPES.includes(itemType as CommentItemType)) return { error: "Invalid item type" };

    const target = await loadTarget(itemType, itemId);
    if (!target || target.projectId !== projectId) return { error: "Item not found" };

    const comment = await prisma.comment.create({
        data: {
            body: body.trim(),
            authorId: user.id,
            itemType,
            itemId,
            parentId: parentId ?? null,
        },
        include: { author: { select: { id: true, name: true } } },
    });

    await notifyMentionedUsers(body, projectId, user.id, itemLabel(itemType, target));
    revalidatePath(`/projects/${projectId}`);
    return { comment };
}

export async function getComments(itemType: string, itemId: string, projectId: string) {
    await requireProjectAccess(projectId);
    const target = await loadTarget(itemType, itemId);
    if (!target || target.projectId !== projectId) return [];

    return prisma.comment.findMany({
        where: { itemType, itemId, parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
            author: { select: { id: true, name: true } },
            replies: {
                orderBy: { createdAt: "asc" },
                include: { author: { select: { id: true, name: true } } },
            },
        },
    });
}

export async function editComment(commentId: string, body: string, projectId: string) {
    const user = await requireProjectAccess(projectId);
    if (!body.trim()) return { error: "Comment cannot be empty" };

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.authorId !== user.id) return { error: "Forbidden" };

    const updated = await prisma.comment.update({
        where: { id: commentId },
        data: { body: body.trim() },
        include: { author: { select: { id: true, name: true } } },
    });

    await notifyMentionedUsers(body, projectId, user.id, "คอมเมนต์");
    revalidatePath(`/projects/${projectId}`);
    return { comment: updated };
}

export async function deleteComment(commentId: string, projectId: string) {
    const user = await requireProjectAccess(projectId);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return { error: "Not found" };

    const isManager = user.role === "ADMIN" || user.role === "PM";
    if (comment.authorId !== user.id && !isManager) return { error: "Forbidden" };

    await prisma.comment.deleteMany({ where: { parentId: commentId } });
    await prisma.comment.delete({ where: { id: commentId } });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
}
