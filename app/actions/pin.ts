"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function togglePinProject(projectId: string) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    let pins: string[] = [];
    try { pins = JSON.parse(user.pinnedProjectIds); } catch { pins = []; }

    if (pins.includes(projectId)) {
        pins = pins.filter(id => id !== projectId);
    } else {
        pins = [...pins, projectId];
    }

    await prisma.user.update({
        where: { id: userId },
        data: { pinnedProjectIds: JSON.stringify(pins) }
    });

    revalidatePath("/projects");
    revalidatePath("/");
}
