// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      avatarUrl?: string | null;
      department?: string | null;
      theme?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    avatarUrl?: string | null;
    department?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    avatarUrl?: string | null;
    department?: string | null;
  }
}
