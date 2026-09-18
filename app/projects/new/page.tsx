import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save, FolderPlus, Building2, Hash, UserCircle2 } from "lucide-react";
import { getAuthUser } from "@/lib/auth";

export default async function CreateProjectPage() {
    const authUser = await getAuthUser();

    // ----------------------------------------------------
    // Server Action สำหรับบันทึกข้อมูลลง Database
    // ----------------------------------------------------
    async function createProject(formData: FormData) {
        "use server";

        const code = (formData.get("code") as string)?.trim();
        const name = (formData.get("name") as string)?.trim();
        const customer = (formData.get("customer") as string)?.trim();

        // 1. ตรวจสอบข้อมูลจากฟอร์มให้ชัดเจน
        if (!code || !name || !customer) {
            throw new Error(`ข้อมูลฟอร์มขาดหาย -> รหัส:${code || '-'}, ชื่อ:${name || '-'}, ลูกค้า:${customer || '-'}`);
        }

        // 2. ดึง Auth User ที่ล็อกอินอยู่เป็น Owner
        const authUser = await getAuthUser();
        let ownerId = authUser?.id;

        if (!ownerId) {
            const firstUser = await prisma.user.findFirst({ select: { id: true } });
            ownerId = firstUser?.id;
        }

        // 3. บันทึกข้อมูลลง Database
        await prisma.project.create({
            data: {
                code,
                name,
                customer,
                stage: "REQUIREMENT",
                progress: 0,
                ownerId: ownerId ?? undefined,
            },
        });

        // Revalidate cache และ Redirect กลับไปที่หน้ารายการโปรเจกต์
        revalidatePath("/");
        revalidatePath("/projects");
        redirect("/projects");
    }

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <Link
                    href="/projects"
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full transition-all text-slate-500 hover:text-slate-700 shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <FolderPlus className="text-emerald-600" size={28} />
                        สร้างโครงการใหม่
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">ตั้งค่าเริ่มต้นสำหรับโปรเจกต์ใหม่ของคุณ</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/40 p-6 md:p-8 relative overflow-hidden">
                {/* Decorative background accent */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <form action={createProject} className="space-y-7 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                        {/* Project Code */}
                        <div className="space-y-2 group">
                            <label htmlFor="code" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                รหัสโครงการ <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Hash size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    placeholder="เช่น PRJ-002"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                                />
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="space-y-2 group">
                            <label htmlFor="customer" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                ชื่อลูกค้า / ผู้มีส่วนได้ส่วนเสีย <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    id="customer"
                                    name="customer"
                                    placeholder="เช่น บริษัท ABC จำกัด"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Project Name */}
                    <div className="space-y-2 group">
                        <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            ชื่อโครงการ <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FolderPlus size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="เช่น ระบบ E-Commerce สำหรับค้าปลีก"
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                            />
                        </div>
                    </div>

                    {/* Project Owner */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">ผู้รับผิดชอบ (Project Owner)</label>
                        <div className="flex items-center gap-3 w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-600">
                            <UserCircle2 size={20} className="text-emerald-500" />
                            <span className="font-medium">{authUser?.name || "System Admin"}</span>
                            <span className="text-xs text-slate-400 ml-auto bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">(ดึงจากระบบ)</span>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Link
                            href="/projects"
                            className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm hover:shadow"
                        >
                            ยกเลิก
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl hover:from-emerald-700 hover:to-green-700 focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Save size={18} />
                            บันทึกโครงการ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}