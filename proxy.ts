import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Next.js 16: proxy.ts replaces the deprecated middleware.ts convention
export async function proxy(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    // Allow public routes without authentication
    const isPublicRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next/static") ||
        pathname.startsWith("/_next/image") ||
        pathname === "/favicon.ico";

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users to login
    if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}
