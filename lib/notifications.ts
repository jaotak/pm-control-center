import { prisma } from "@/lib/prisma";

export async function sendNotification(userId: string, title: string, message: string, link?: string) {
    if (!userId) return;
    await prisma.notification.create({
        data: { userId, title, message, link },
    });
}

export async function notifyMentionedUsers(
    body: string,
    projectId: string,
    authorId: string,
    itemLabel: string
) {
    const members = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            owner: { select: { id: true, name: true, email: true } },
            developers: { select: { id: true, name: true, email: true } },
        },
    });
    if (!members) return;

    const team = [
        ...(members.owner ? [members.owner] : []),
        ...members.developers,
    ].filter((u) => u.id !== authorId);

    const lower = body.toLowerCase();
    const mentioned = team.filter((u) => {
        const name = u.name.toLowerCase();
        const emailLocal = u.email.split("@")[0].toLowerCase();
        return lower.includes(`@${name}`) || lower.includes(`@${emailLocal}`);
    });

    await Promise.all(
        mentioned.map((u) =>
            sendNotification(
                u.id,
                "มีคนกล่าวถึงคุณในคอมเมนต์",
                `${itemLabel}: ${body.slice(0, 120)}`,
                `/projects/${projectId}`
            )
        )
    );
}
