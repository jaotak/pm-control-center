"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";

export async function addComment(
    itemType: string,
    itemId: string,
    body: string,
    projectId: string,
    parentId?: string
) {
    const user = await getAuthUser();
    if (!user || !body.trim()) return;

    await prisma.comment.create({
        data: {
            body: body.trim(),
            authorId: user.id,
            itemType,
            itemId,
            parentId: parentId ?? null,
        }
    });

    revalidatePath(`/projects/${projectId}`);
}

export async function getComments(itemType: string, itemId: string) {
    return prisma.comment.findMany({
        where: { itemType, itemId, parentId: null }, // only top-level
        orderBy: { createdAt: "asc" },
        include: {
            author: { select: { id: true, name: true } },
            replies: {
                orderBy: { createdAt: "asc" },
                include: { author: { select: { id: true, name: true } } }
            }
        }
    });
}

export async function deleteComment(commentId: string, projectId: string) {
    const user = await getAuthUser();
    if (!user) return;

    // Only allow deletion by author
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.authorId !== user.id) return;

    await prisma.comment.delete({ where: { id: commentId } });
    revalidatePath(`/projects/${projectId}`);
}
