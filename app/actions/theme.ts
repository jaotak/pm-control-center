"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Saves the user's theme preference to the database.
 * Called by ThemeContext on toggle so the preference persists across devices.
 */
export async function saveTheme(theme: "light" | "dark") {
    const user = await getAuthUser();
    if (!user) return;

    await prisma.user.update({
        where: { id: user.id },
        data: { theme },
    });

    revalidatePath("/", "layout");
}
