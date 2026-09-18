import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { scanOverdueItems } from "@/lib/overdue";

export async function GET() {
    const user = await getAuthUser();
    if (!user || !["ADMIN", "PM"].includes(user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await scanOverdueItems();
    return NextResponse.json({ ok: true, ...result });
}
