"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// สำหรับ Admin: เปลี่ยนตัว PM ของโปรเจกต์
export async function assignProjectOwner(projectId: string, ownerId: string) {
    await prisma.project.update({
        where: { id: projectId },
        data: { ownerId: ownerId === "" ? null : ownerId }
    });
    revalidatePath(`/projects/${projectId}`);
}

// สำหรับ PM: ดึงตัว Dev เข้าโปรเจกต์
export async function addDeveloperToProject(projectId: string, developerId: string) {
    await prisma.project.update({
        where: { id: projectId },
        data: { developers: { connect: { id: developerId } } }
    });
    revalidatePath(`/projects/${projectId}`);
}

// สำหรับ PM: เอา Dev ออกจากโปรเจกต์
export async function removeDeveloperFromProject(projectId: string, developerId: string) {
    await prisma.project.update({
        where: { id: projectId },
        data: { developers: { disconnect: { id: developerId } } }
    });
    revalidatePath(`/projects/${projectId}`);
}