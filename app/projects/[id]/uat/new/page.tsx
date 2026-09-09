import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save, Paperclip } from "lucide-react";
import { createUATCase } from "@/app/actions/create";

export default async function NewUATPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // ดึง Req เพื่อให้เลือกผูกได้ (ดึงเฉพาะของโปรเจกต์นี้)
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            requirements: true,
            owner: true,
            developers: true
        }
    });

    if (!project) return <div>Project not found</div>;

    // รวมรายชื่อคนในทีม
    const team = [];
    if (project.owner) team.push(project.owner);
    project.developers.forEach(dev => team.push(dev));

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/projects/${id}?tab=uat`} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">สร้าง UAT Case ใหม่</h1>
                    <p className="text-sm text-gray-500 mt-1">โครงการ: {project.name}</p>
                </div>
            </div>

            <form action={createUATCase} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
                <input type="hidden" name="projectId" value={id} />

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">หัวข้อทดสอบ (Title) *</label>
                    <input
                        type="text" name="title" required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="เช่น สามารถล็อกอินด้วย Google Account ได้"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Paperclip size={16} className="text-gray-500" />
                        แนบไฟล์ (Attachments)
                    </label>
                    <input
                        type="file"
                        id="attachments"
                        name="attachments"
                        multiple
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">สามารถเลือกได้หลายไฟล์ (ขนาดไม่เกิน 10MB/ไฟล์)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">อ้างอิง Requirement (ไม่บังคับ)</label>
                        <select name="requirementId" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white">
                            <option value="">-- ไม่ระบุ --</option>
                            {project.requirements.map(req => (
                                <option key={req.id} value={req.id}>[{req.reqCode}] {req.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">ผู้รับผิดชอบการทดสอบ</label>
                        <select name="assigneeId" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white">
                            <option value="">-- ไม่ระบุ --</option>
                            {team.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                    <input type="checkbox" id="isMandatory" name="isMandatory" className="w-5 h-5 accent-red-600" />
                    <label htmlFor="isMandatory" className="text-sm font-bold text-red-800 cursor-pointer">
                        กำหนดให้เป็นเคส &ldquo;บังคับผ่าน&rdquo; (Mandatory)
                        <span className="block text-xs font-normal text-red-600">หากเคสนี้ไม่ผ่าน จะถือว่าระบบไม่พร้อมใช้งานทันที</span>
                    </label>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2">
                        <Save size={18} /> บันทึก Test Case
                    </button>
                </div>
            </form>
        </div>
    );
}