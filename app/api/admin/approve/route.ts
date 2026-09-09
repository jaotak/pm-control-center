import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !["approve", "reject"].includes(action)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (action === "approve") {
        const target = await prisma.user.update({
            where: { id: userId },
            data: { isApproved: true },
        });

        // Notify the approved user
        await prisma.notification.create({
            data: {
                userId: target.id,
                title: "✅ บัญชีของคุณได้รับการอนุมัติแล้ว",
                message: `ยินดีต้อนรับ ${target.name}! คุณสามารถเข้าสู่ระบบ PM Control Center ได้แล้ว`,
                link: "/",
            },
        });

        // Write admin log
        await prisma.adminLog.create({
            data: {
                adminId: user.id,
                action: "APPROVE_USER",
                targetId: userId,
                metadata: `Approved user ${target.name} (${target.email})`,
            },
        });

        return NextResponse.json({ ok: true, action: "approved" });
    }

    if (action === "reject") {
        const target = await prisma.user.findUnique({ where: { id: userId } });

        // Delete the rejected user
        await prisma.user.delete({ where: { id: userId } });

        // Write admin log
        await prisma.adminLog.create({
            data: {
                adminId: user.id,
                action: "REJECT_USER",
                targetId: null,
                metadata: `Rejected and deleted user ${target?.name} (${target?.email})`,
            },
        });

        return NextResponse.json({ ok: true, action: "rejected" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
