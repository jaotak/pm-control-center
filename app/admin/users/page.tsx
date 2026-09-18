import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (role !== "ADMIN") redirect("/403");

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            avatarUrl: true,
            _count: {
                select: { projectsOwned: true, projectsAssigned: true }
            }
        }
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 p-6 md:p-8 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <Link href="/admin" className="p-2.5 bg-white hover:bg-slate-50 rounded-full text-slate-500 hover:text-slate-800 transition-all border border-slate-200/80 shadow-sm relative z-10 hover:shadow">
                    <ArrowLeft size={18} />
                </Link>
                <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 rounded-2xl border border-emerald-100/80 shadow-sm relative z-10">
                    <Users size={26} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">User Management</h1>
                    <p className="text-sm text-slate-500 mt-1">จัดการผู้ใช้งาน บทบาท และการเข้าถึงระบบ — <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{Array.isArray(users) ? users.length : 0} users</span></p>
                </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-7">
                <UsersTable users={users} />
            </div>
        </div>
    );
}
