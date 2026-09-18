import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCheck, Clock, Building2, Phone } from "lucide-react";
import ApprovalActions from "@/app/admin/approvals/ApprovalActions";

export default async function ApprovalsPage() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (role !== "ADMIN") redirect("/403");

    const pendingUsers = await prisma.user.findMany({
        where: { isApproved: false },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 p-6 md:p-8 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <Link href="/admin" className="p-2.5 bg-white hover:bg-slate-50 rounded-full text-slate-500 border border-slate-200/80 shadow-sm relative z-10 hover:shadow">
                    <ArrowLeft size={18} />
                </Link>
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 rounded-2xl border border-amber-100/80 shadow-sm relative z-10">
                    <UserCheck size={26} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pending Approvals</h1>
                    <p className="text-sm text-slate-500 mt-1">อนุมัติหรือปฏิเสธผู้ใช้งานใหม่ที่รอการอนุมัติ — <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{pendingUsers.length} รายการ</span></p>
                </div>
            </div>

            {pendingUsers.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-16 text-center">
                    <UserCheck size={48} className="mx-auto mb-4 text-emerald-400 opacity-60" />
                    <p className="text-slate-600 font-semibold text-sm">ไม่มีผู้ใช้งานรอการอนุมัติ</p>
                    <p className="text-slate-400 text-xs mt-1">ผู้ใช้ใหม่ที่ลงทะเบียนจะปรากฏที่นี่</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {pendingUsers.map((user) => (
                        <div key={user.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-extrabold shrink-0 shadow-md shadow-amber-500/20 overflow-hidden">
                                {user.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover bg-white" />
                                ) : (
                                    user.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                        รอการอนุมัติ
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                    {user.department && (
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <Building2 size={11} /> {user.department}
                                        </span>
                                    )}
                                    {user.phone && (
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <Phone size={11} /> {user.phone}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                        <Clock size={11} /> {new Date(user.createdAt).toLocaleString("th-TH")}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <ApprovalActions userId={user.id} userName={user.name} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
