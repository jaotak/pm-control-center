import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function CreateProjectPage() {
    // ดึงข้อมูล User คนแรกจากระบบมาเป็น Owner ชั่วคราว (เพราะเรายังไม่มีระบบ Login แบบเต็ม)
    const defaultUser = await prisma.user.findFirst();

    // ----------------------------------------------------
    // Server Action สำหรับบันทึกข้อมูลลง Database
    // ----------------------------------------------------
    async function createProject(formData: FormData) {
        "use server";

        const code = formData.get("code") as string;
        const name = formData.get("name") as string;
        const customer = formData.get("customer") as string;

        // 1. ตรวจสอบข้อมูลจากฟอร์มให้ชัดเจน
        if (!code || !name || !customer) {
            throw new Error(`ข้อมูลฟอร์มขาดหาย -> รหัส:${code || '-'}, ชื่อ:${name || '-'}, ลูกค้า:${customer || '-'}`);
        }

        // 2. ดึงข้อมูล User ภายใน Action (เพื่อแก้ปัญหา Scope)
        let actionUser = await prisma.user.findFirst();

        // 3. ถ้าฐานข้อมูลยังว่างเปล่าจริงๆ ให้สร้าง User อัตโนมัติไปเลย
        if (!actionUser) {
            actionUser = await prisma.user.create({
                data: {
                    name: "System Admin",
                    email: "admin@example.com",
                    password: "",
                    role: "PM",
                }
            });
        }

        // 4. บันทึกข้อมูลลง Database
        await prisma.project.create({
            data: {
                code,
                name,
                customer,
                stage: "REQUIREMENT",
                progress: 0,
                ownerId: actionUser.id,
            },
        });

        // เมื่อบันทึกเสร็จ ให้ Redirect กลับไปที่หน้ารายการโปรเจกต์
        redirect("/projects");
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* ส่วนหัว และปุ่มย้อนกลับ */}
            <div className="flex items-center gap-4">
                <Link
                    href="/projects"
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">สร้างโครงการใหม่</h1>
            </div>

            {/* กล่องฟอร์ม */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
                <form action={createProject} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Project Code[cite: 1] */}
                        <div className="space-y-2">
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                รหัสโครงการ (Project Code) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                placeholder="เช่น PRJ-002"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            />
                        </div>

                        {/* Customer[cite: 1] */}
                        <div className="space-y-2">
                            <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
                                ชื่อลูกค้า (Customer / Stakeholder) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="customer"
                                name="customer"
                                placeholder="เช่น บริษัท ABC จำกัด"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Project Name[cite: 1] */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            ชื่อโครงการ (Project Name) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="เช่น ระบบ E-Commerce สำหรับค้าปลีก"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        />
                    </div>

                    {/* แสดง Owner อัตโนมัติ (อ่านอย่างเดียว) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">ผู้รับผิดชอบ (Project Owner)</label>
                        <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                            {defaultUser?.name || "System Admin"} (ดึงจากระบบอัตโนมัติ)
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* ปุ่ม Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Link
                            href="/projects"
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors"
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