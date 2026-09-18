import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getSystemStats, getAdminLogs } from "@/app/actions/admin";
import { FolderKanban, Users, AlertCircle, CheckSquare, Shield, ClipboardList, Bell, UserCheck } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminLog } from "@prisma/client";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    ROLE_CHANGE:    { label: "Role Changed",    color: "bg-violet-100 text-violet-700" },
    TOGGLE_ACTIVE:  { label: "Active Toggle",   color: "bg-amber-100 text-amber-700" },
    RESET_PASSWORD: { label: "Password Reset",  color: "bg-rose-100 text-rose-700" },
    CREATE_USER:    { label: "User Created",    color: "bg-emerald-100 text-emerald-700" },
    APPROVE_USER:   { label: "User Approved",   color: "bg-teal-100 text-teal-700" },
    REJECT_USER:    { label: "User Rejected",   color: "bg-orange-100 text-orange-700" },
};

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (role !== "ADMIN") redirect("/403");

    const [stats, adminLogs, adminUsers, pendingApprovals] = await Promise.all([
        getSystemStats(),
        getAdminLogs(30),
        prisma.user.findMany({ select: { id: true, name: true, avatarUrl: true } }),
        prisma.user.count({ where: { isApproved: false } }),
    ]);

    const userMap = Object.fromEntries(adminUsers.map(u => [u.id, u]));

    const statCards = [
        { label: "Total Projects",      value: stats.totalProjects,  icon: FolderKanban, color: "from-emerald-500 to-green-600", bg: "bg-emerald-50",  text: "text-emerald-700" },
        { label: "Total Users",          value: stats.totalUsers,     icon: Users,         color: "from-violet-500 to-teal-600", bg: "bg-violet-50", text: "text-violet-700" },
        { label: "Pending Approvals",    value: pendingApprovals,     icon: UserCheck,     color: "from-amber-500 to-orange-500", bg: "bg-amber-50",  text: "text-amber-700" },
        { label: "Open Issues",          value: stats.openIssues,     icon: AlertCircle,   color: "from-rose-500 to-red-600", bg: "bg-rose-50",    text: "text-rose-700" },
        { label: "Pending Tasks",        value: stats.pendingTasks,   icon: CheckSquare,   color: "from-amber-500 to-orange-500", bg: "bg-amber-50",  text: "text-amber-700" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-7 pb-12">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 p-6 md:p-8 flex items-center gap-4 relative overflow-hidden">
                {/* Decorative background accent */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 rounded-2xl border border-emerald-100/80 shadow-sm relative z-10">
                    <Shield size={28} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Admin Control Panel</h1>
                    <p className="text-sm text-slate-500 mt-1">ระบบจัดการผู้ใช้งานและภาพรวมทั้งหมดของระบบ</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 hover:shadow-md transition-shadow">
                            <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                                <Icon size={22} className={card.text} />
                            </div>
                            <div className="text-3xl font-extrabold text-slate-800">{card.value}</div>
                            <div className="text-xs font-semibold text-slate-500 mt-0.5">{card.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Links */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
                <h2 className="text-base font-extrabold text-slate-800 mb-4 border-b border-slate-100 pb-3">Admin Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/admin/users" className="flex items-center gap-3 p-4 border border-slate-200/80 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/60 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Users size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800">User Management</div>
                            <div className="text-xs text-slate-500">จัดการผู้ใช้งาน, บทบาท และรหัสผ่าน</div>
                        </div>
                    </Link>
                    <Link href="/admin/approvals" className="flex items-center gap-3 p-4 border border-slate-200/80 rounded-2xl hover:border-amber-300 hover:bg-amber-50/60 transition-all group relative">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                            <UserCheck size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800">Pending Approvals</div>
                            <div className="text-xs text-slate-500">อนุมัติผู้ใช้งานใหม่ที่รอดำเนินการ</div>
                        </div>
                        {pendingApprovals > 0 && (
                            <span className="absolute top-3 right-3 text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {pendingApprovals}
                            </span>
                        )}
                    </Link>
                    <Link href="/projects" className="flex items-center gap-3 p-4 border border-slate-200/80 rounded-2xl hover:border-violet-300 hover:bg-violet-50/60 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                            <FolderKanban size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800">All Projects</div>
                            <div className="text-xs text-slate-500">ดูโปรเจกต์ทั้งหมดในระบบ</div>
                        </div>
                    </Link>
                    <Link href="/api/notify/overdue" target="_blank" className="flex items-center gap-3 p-4 border border-slate-200/80 rounded-2xl hover:border-amber-300 hover:bg-amber-50/60 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                            <Bell size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800">Send Overdue Alerts</div>
                            <div className="text-xs text-slate-500">สแกนและส่งแจ้งเตือนงานเกินกำหนด</div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Admin Audit Log */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
                <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <ClipboardList size={18} className="text-slate-500" /> Admin Audit Log
                    <span className="ml-auto text-xs font-medium text-slate-400">(30 รายการล่าสุด)</span>
                </h2>

                {(adminLogs as AdminLog[]).length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-8">ยังไม่มีรายการ Admin Activity</p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        {(adminLogs as AdminLog[]).map((log) => {
                            const badge = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-slate-100 text-slate-600" };
                            return (
                                <div key={log.id} className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-emerald-600 flex items-center justify-center text-[9px] font-extrabold text-white shrink-0 mt-0.5 overflow-hidden">
                                        {userMap[log.adminId]?.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={userMap[log.adminId].avatarUrl!} alt="Avatar" className="w-full h-full object-cover bg-white" />
                                        ) : (
                                            (userMap[log.adminId]?.name ?? "?").charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-slate-700">{userMap[log.adminId]?.name ?? log.adminId}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                                            {log.targetId && (
                                                <span className="text-[10px] text-slate-400">→ {userMap[log.targetId]?.name ?? log.targetId}</span>
                                            )}
                                        </div>
                                        {log.metadata && (
                                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{log.metadata}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString("th-TH")}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
