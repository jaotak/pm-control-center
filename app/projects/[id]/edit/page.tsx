import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditProjectPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    // ดึงข้อมูลเดิมมาแสดงในฟอร์ม
    const project = await prisma.project.findUnique({
        where: { id },
    });

    if (!project) notFound();

    // Server Action สำหรับอัปเดตข้อมูล
    async function updateProject(formData: FormData) {
        "use server";

        const code = formData.get("code") as string;
        const name = formData.get("name") as string;
        const customer = formData.get("customer") as string;


        await prisma.project.update({
            where: { id },
            data: { code, name, customer },
        });

        redirect(`/projects/${id}`);
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/projects/${id}`} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">แก้ไขโครงการ</h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
                <form action={updateProject} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">รหัสโครงการ</label>
                            <input type="text" name="code" defaultValue={project.code} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">ชื่อลูกค้า</label>
                            <input type="text" name="customer" defaultValue={project.customer} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">ชื่อโครงการ</label>
                        <input type="text" name="name" defaultValue={project.name} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>



                    <hr className="border-gray-100" />

                    <div className="flex justify-end gap-3 pt-2">
                        <Link href={`/projects/${id}`} className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</Link>
                        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                            <Save size={18} /> บันทึกการเปลี่ยนแปลง
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}