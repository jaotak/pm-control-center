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
        <div className="max-w-3xl mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4 mb-2">
                <Link 
                    href={`/projects/${id}?tab=uat`} 
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full transition-all text-slate-500 hover:text-slate-700 shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        สร้าง UAT Case ใหม่
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">โครงการ: <span className="font-semibold text-slate-700">{project.name}</span></p>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/40 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <form action={createUATCase} className="space-y-7 relative z-10">
                    <input type="hidden" name="projectId" value={id} />

                    <div className="space-y-2 group">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            หัวข้อทดสอบ (Title) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text" name="title" required
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                            placeholder="เช่น สามารถล็อกอินด้วย Google Account ได้"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                        <div className="space-y-2 group">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">อ้างอิง Requirement (ไม่บังคับ)</label>
                            <select name="requirementId" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium">
                                <option value="">-- ไม่ระบุ --</option>
                                {project.requirements.map(req => (
                                    <option key={req.id} value={req.id}>[{req.reqCode}] {req.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 group">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">ผู้รับผิดชอบการทดสอบ</label>
                            <select name="assigneeId" className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium">
                                <option value="">-- ไม่ระบุ --</option>
                                {team.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label htmlFor="attachments" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Paperclip size={16} className="text-emerald-500" />
                            แนบไฟล์ (Attachments)
                        </label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-300 transition-all text-center p-4">
                            <input
                                type="file"
                                id="attachments"
                                name="attachments"
                                multiple
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100 transition-colors cursor-pointer"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 pl-1">สามารถเลือกได้หลายไฟล์ (ขนาดไม่เกิน 10MB/ไฟล์)</p>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-rose-50/50 border border-rose-100 rounded-xl transition-colors hover:bg-rose-50 cursor-pointer">
                        <div className="pt-0.5">
                            <input type="checkbox" id="isMandatory" name="isMandatory" className="w-5 h-5 accent-rose-600 rounded border-gray-300 cursor-pointer focus:ring-rose-500" />
                        </div>
                        <label htmlFor="isMandatory" className="cursor-pointer">
                            <div className="text-sm font-bold text-rose-800">
                                กำหนดให้เป็นเคส &ldquo;บังคับผ่าน&rdquo; (Mandatory)
                            </div>
                            <div className="text-xs font-medium text-rose-600 mt-0.5">หากเคสนี้ไม่ผ่าน จะถือว่าระบบไม่พร้อมใช้งานทันที</div>
                        </label>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="flex justify-end gap-3 pt-4">
                        <Link
                            href={`/projects/${id}?tab=uat`}
                            className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm hover:shadow"
                        >
                            ยกเลิก
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl hover:from-emerald-700 hover:to-green-700 focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Save size={18} />
                            บันทึก Test Case
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}