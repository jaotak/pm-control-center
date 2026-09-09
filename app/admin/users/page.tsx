import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/app/actions/admin";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN") redirect("/403");

    const users = await getAllUsers();

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-8 flex items-center gap-4">
                <Link href="/admin" className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/60">
                    <ArrowLeft size={18} />
                </Link>
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/80">
                    <Users size={26} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">User Management</h1>
                    <p className="text-xs text-slate-500 mt-1">จัดการผู้ใช้งาน บทบาท และการเข้าถึงระบบ — {Array.isArray(users) ? users.length : 0} users</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-7">
                <UsersTable users={users as any} />
            </div>
        </div>
    );
}
