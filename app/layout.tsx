import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { AuthProvider } from "@/app/Providers";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { SidebarProvider } from "@/app/context/SidebarContext";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PM Control Center",
  description: "Project Management System",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the user's persisted theme from DB to avoid flash on first load
  let initialTheme: "light" | "dark" = "light";
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { theme: true } });
      if (user?.theme === "dark") initialTheme = "dark";
    }
  } catch {
    // If DB is unreachable, fall back to light
  }

  return (
    <html lang="th" suppressHydrationWarning data-theme={initialTheme}>
      <body className={`${inter.className} bg-gray-50 dark:bg-slate-950 transition-colors`}>
        <AuthProvider>
          <ThemeProvider initialTheme={initialTheme}>
            <SidebarProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
                  <Topbar />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar w-full relative">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}