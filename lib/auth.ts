import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "PM" | "DEV" | string;
};

type ProjectAccess = "member" | "manager";

/**
 * Typed replacement for the repeated `(session?.user as any)?.id` pattern.
 * Returns null if the user is not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string } | undefined;
    if (!sessionUser?.id) return null;
    // JWT claims can outlive a role change or account deactivation. Read the
    // current account state for every privileged server-side operation.
    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, name: true, email: true, role: true, isActive: true, isApproved: true },
    });
    if (!user || !user.isActive || !user.isApproved) return null;
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? "DEV",
    };
}

/**
 * Authoritative project-level access check for Server Actions and Route Handlers.
 * PMs may manage only projects they own; developers may access only projects to
 * which they are assigned; admins have full access.
 */
export async function requireProjectAccess(projectId: string, access: ProjectAccess = "member") {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true, developers: { where: { id: user.id }, select: { id: true } } },
    });
    if (!project) throw new Error("Project not found");

    const isAdmin = user.role === "ADMIN";
    const isOwner = project.ownerId === user.id;
    const isMember = isOwner || project.developers.length > 0;
    const allowed = access === "manager" ? isAdmin || isOwner : isAdmin || isMember;
    if (!allowed) throw new Error("Forbidden");

    return user;
}

/** Reject client-supplied project IDs that do not match the item being mutated. */
export function assertItemBelongsToProject(itemProjectId: string | null, projectId: string) {
    if (itemProjectId !== projectId) throw new Error("Item does not belong to this project");
}
