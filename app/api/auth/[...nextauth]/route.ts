import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                const email = credentials.username.trim();
                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user) return null;

                // Check if account is deactivated
                if (!user.isActive) {
                    throw new Error("ACCOUNT_DEACTIVATED");
                }

                // Check if account is pending approval
                if (!user.isApproved) {
                    throw new Error("PENDING_APPROVAL");
                }

                // Password verification (supports both hashed and legacy plaintext)
                let isPasswordValid = false;
                if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
                    isPasswordValid = await bcrypt.compare(credentials.password, user.password);
                } else {
                    isPasswordValid = user.password === credentials.password;
                }

                if (!isPasswordValid) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                    theme: user.theme || "light",
                };
            }
        })
    ],
    session: {
        strategy: "jwt" as const,
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.avatarUrl = user.avatarUrl;
                token.theme = (user as any).theme || "light";
            }
            if (trigger === "update") {
                if (session?.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl;
                if (session?.theme !== undefined) token.theme = session.theme;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.avatarUrl = token.avatarUrl;
                session.user.theme = token.theme || "light";
            }
            return session;
        },
        async redirect({ url, baseUrl }: any) {
            // Allow relative callback URLs (e.g. "/login") to stay on current host/origin
            if (url.startsWith("/")) return url;
            try {
                if (new URL(url).origin === baseUrl) return url;
            } catch { }
            return "/login";
        }
    },
    pages: {
        signIn: '/login',
        signOut: '/login',
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };