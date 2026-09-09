"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { prisma as db } from "@/lib/prisma";

async function writeAdminLog(adminId: string, action: string, targetId?: string, detail?: string) {
    await db.adminLog.create({
        data: { adminId, action, targetId, metadata: detail },
    });
}

export async function getAllUsers() {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") return { error: "Unauthorized" };

    return prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: {
                select: { projectsOwned: true, projectsAssigned: true }
            }
        }
    });
}

export async function updateUserRole(userId: string, role: string) {
    const caller = await getAuthUser();
    if (!caller || caller.role !== "ADMIN") return { error: "Unauthorized" };

    await prisma.user.update({ where: { id: userId }, data: { role } });
    await writeAdminLog(caller.id, "ROLE_CHANGE", userId, `Changed role to ${role}`);
    revalidatePath("/admin/users");
    return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
    const caller = await getAuthUser();
    if (!caller || caller.role !== "ADMIN") return { error: "Unauthorized" };

    await prisma.user.update({ where: { id: userId }, data: { isActive } });
    await writeAdminLog(caller.id, "TOGGLE_ACTIVE", userId, `Set isActive=${isActive}`);
    revalidatePath("/admin/users");
    return { success: true };
}

export async function adminResetPassword(userId: string, newPassword: string) {
    const caller = await getAuthUser();
    if (!caller || caller.role !== "ADMIN") return { error: "Unauthorized" };

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await writeAdminLog(caller.id, "RESET_PASSWORD", userId);
    revalidatePath("/admin/users");
    return { success: true };
}

export async function adminCreateUser(name: string, email: string, password: string, role: string) {
    const caller = await getAuthUser();
    if (!caller || caller.role !== "ADMIN") return { error: "Unauthorized" };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "Email already exists" };

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { name, email, password: hashed, role } });
    await writeAdminLog(caller.id, "CREATE_USER", newUser.id, `Created user ${email} with role ${role}`);
    revalidatePath("/admin/users");
    return { success: true };
}

export async function getSystemStats() {
    const [totalProjects, totalUsers, openIssues, pendingTasks] = await Promise.all([
        prisma.project.count(),
        prisma.user.count(),
        prisma.issue.count({ where: { status: { notIn: ["Resolved", "Closed"] }, deletedAt: null } }),
        prisma.task.count({ where: { isCompleted: false, deletedAt: null } }),
    ]);
    return { totalProjects, totalUsers, openIssues, pendingTasks };
}

export async function getAdminLogs(limit = 50) {
    const caller = await getAuthUser();
    if (!caller || caller.role !== "ADMIN") return [];

    return prisma.adminLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}
