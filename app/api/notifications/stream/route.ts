import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (!token?.sub) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = token.sub;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            const poll = async () => {
                try {
                    const notifications = await prisma.notification.findMany({
                        where: { userId, isRead: false },
                        orderBy: { createdAt: "desc" },
                        take: 20,
                    });
                    send({ count: notifications.length, notifications });
                } catch {
                    // DB error — skip this tick
                }
            };

            // Send immediately
            await poll();

            // Poll every 15 seconds
            const interval = setInterval(poll, 15000);

            // Cleanup when client disconnects
            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
