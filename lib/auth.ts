import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "PM" | "DEV" | string;
};

/**
 * Typed replacement for the repeated `(session?.user as any)?.id` pattern.
 * Returns null if the user is not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) return null;
    return {
        id: user.id,
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? "DEV",
    };
}
