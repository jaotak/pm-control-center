import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.username.trim().toLowerCase() },
                });
                if (!user) return null;
                if (!user.isActive) throw new Error("ACCOUNT_DEACTIVATED");
                if (!user.isApproved) throw new Error("PENDING_APPROVAL");

                const valid = await bcrypt.compare(credentials.password, user.password);
                if (!valid) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                    theme: user.theme || "light",
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.avatarUrl = user.avatarUrl;
                token.theme = (user as typeof user & { theme?: string }).theme || "light";
            }
            if (trigger === "update") {
                if (session?.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl;
                if (session?.theme !== undefined) token.theme = session.theme;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role ?? "DEV";
                session.user.id = (token.id as string) ?? "";
                session.user.avatarUrl = token.avatarUrl;
                session.user.theme = (token.theme as string) || "light";
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return url;
            try {
                if (new URL(url).origin === baseUrl) return url;
            } catch { /* use the sign-in page */ }
            return "/login";
        },
    },
    pages: { signIn: "/login", signOut: "/login" },
};
