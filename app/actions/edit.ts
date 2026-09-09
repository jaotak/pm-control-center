"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logActivity } from "./progress";

export async function editRequirement(
    id: string,
    title: string,
    description: string,
    projectId: string,
    priority?: string,
    dueDate?: string | null
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const req = await prisma.requirement.update({
        where: { id },
        data: {
            title,
            description,
            priority: priority || "Normal",
            dueDate: dueDate ? new Date(dueDate) : null
        }
    });

    if (userId) {
        await logActivity(projectId, userId, `แก้ไขข้อมูล Requirement [${req.reqCode}]: "${title}"`);
    }

    revalidatePath(`/projects/${projectId}`);
}

export async function editUATCase(
    id: string,
    title: string,
    expectedResult: string,
    projectId: string,
    priority?: string,
    dueDate?: string | null
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const uat = await prisma.uATCase.update({
        where: { id },
        data: {
            title,
            expectedResult,
            priority: priority || "Normal",
            dueDate: dueDate ? new Date(dueDate) : null
        }
    });

    if (userId) {
        await logActivity(projectId, userId, `แก้ไขข้อมูล UAT Case [${uat.uatCode}]: "${title}"`);
    }

    revalidatePath(`/projects/${projectId}`);
}

export async function editIssue(
    id: string,
    title: string,
    stepsToReproduce: string,
    projectId: string,
    priority?: string,
    dueDate?: string | null
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const issue = await prisma.issue.update({
        where: { id },
        data: {
            title,
            stepsToReproduce,
            priority: priority || "Normal",
            dueDate: dueDate ? new Date(dueDate) : null
        }
    });

    if (userId) {
        await logActivity(projectId, userId, `แก้ไขข้อมูล Issue [${issue.issueCode}]: "${title}"`);
    }

    revalidatePath(`/projects/${projectId}`);
}