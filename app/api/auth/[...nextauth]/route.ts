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

                const user = await prisma.user.findUnique({
                    where: { email: credentials.username }
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
                    avatarUrl: user.avatarUrl
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
            }
            if (trigger === "update" && session?.avatarUrl !== undefined) {
                token.avatarUrl = session.avatarUrl;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.avatarUrl = token.avatarUrl;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };