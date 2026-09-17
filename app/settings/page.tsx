import { prisma } from "@/lib/prisma";
import { Notification } from "@prisma/client";
import { User, Settings as SettingsIcon, Shield, Bell } from "lucide-react";
import ProfileForm from "./ProfileForm";
import { getAuthUser } from "@/lib/auth";
import Link from "next/link";
import NotificationList from "./NotificationList";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const authUser = await getAuthUser();
    if (!authUser) return <div className="p-8 text-center text-slate-500 font-semibold">กรุณาเข้าสู่ระบบ</div>;

    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) return <div className="p-8 text-center text-slate-500 font-semibold">User not found</div>;

    const resolvedParams = await searchParams;
    const currentTab = resolvedParams.tab || "profile";
    
    let notifications: Notification[] = [];
    if (currentTab === "notifications") {
        notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 100
        });
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-8 flex items-center gap-4">
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/80 shadow-2xs">
                    <SettingsIcon size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Settings</h1>
                    <p className="text-xs text-slate-500 mt-1">จัดการข้อมูลส่วนตัว, รหัสผ่าน และการตั้งค่าระบบ</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Side Menu */}
                <div className="space-y-1.5">
                    <Link href="/settings?tab=profile" className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-2xl transition-all ${currentTab === "profile" ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-md shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100/80"}`}>
                        <User size={17} /> ข้อมูลส่วนตัว
                    </Link>
                    <Link href="/settings?tab=notifications" className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-2xl transition-all ${currentTab === "notifications" ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-md shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100/80"}`}>
                        <Bell size={17} /> การแจ้งเตือน
                    </Link>
                    {user.role === "ADMIN" && (
                        <Link href="/admin/users" className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100/80 font-semibold text-xs rounded-2xl transition-all">
                            <Shield size={17} /> จัดการผู้ใช้งาน (Admin)
                        </Link>
                    )}
                </div>

                {/* Right Side Content Panel */}
                <div className="md:col-span-3 space-y-6">
                    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-7">
                        {currentTab === "profile" && (
                            <>
                                <h2 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                                    <User size={18} className="text-emerald-600" />
                                    ข้อมูลโปรไฟล์ส่วนตัว (Profile Information)
                                </h2>
                                <ProfileForm user={{
                                    id: user.id,
                                    name: user.name,
                                    email: user.email,
                                    department: user.department ?? "",
                                    phone: user.phone ?? "",
                                    avatarUrl: user.avatarUrl,
                                }} />
                            </>
                        )}
                        {currentTab === "notifications" && (
                            <>
                                <h2 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                                    <Bell size={18} className="text-emerald-600" />
                                    การแจ้งเตือนทั้งหมดของคุณ (Notifications)
                                </h2>
                                <NotificationList initialNotifications={notifications} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
