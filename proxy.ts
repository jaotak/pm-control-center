import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Next.js 16: proxy.ts replaces the deprecated middleware.ts convention
export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public routes without authentication
    const isPublicRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/uploads") ||
        pathname === "/favicon.ico";

    if (isPublicRoute) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Redirect unauthenticated users to login
    if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
    ],
};
