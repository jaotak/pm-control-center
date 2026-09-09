import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ count: 0 });
    }

    const count = await prisma.user.count({ where: { isApproved: false } });
    return NextResponse.json({ count });
}
