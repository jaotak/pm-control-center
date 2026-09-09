"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function hideActivityLog(logId: string) {
    const user = await getAuthUser();
    
    // Check if user is authorized. We'll allow PMs and ADMINs to hide logs.
    if (!user || (user.role !== "ADMIN" && user.role !== "PM")) {
        throw new Error("ไม่มีสิทธิ์ในการซ่อนประวัติ (Unauthorized)");
    }
    
    // Get the log to find the project it belongs to (for revalidation)
    const log = await prisma.activityLog.findUnique({ where: { id: logId } });
    if (!log) return;
    
    await prisma.activityLog.update({
        where: { id: logId },
        data: { isHidden: true }
    });
    
    revalidatePath(`/projects/${log.projectId}`);
    revalidatePath(`/projects/${log.projectId}/reports`);
}
