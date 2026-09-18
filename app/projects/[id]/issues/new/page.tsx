import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bug, Paperclip } from "lucide-react";
import { createIssue } from "@/app/actions/create";

export default async function NewIssuePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: { owner: true, developers: true }
    });

    if (!project) {
        redirect("/projects");
    }

    const team: { id: string; name: string | null }[] = [];
    if (project.owner) team.push(project.owner);
    project.developers.forEach(dev => team.push(dev));

    const uatCases = await prisma.uATCase.findMany({
        where: { projectId: id }
    });

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4 mb-2">
                <Link
                    href={`/projects/${id}?tab=issues`}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full transition-all text-slate-500 hover:text-slate-700 shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        แจ้งปัญหา (Log Issue)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">โครงการ: <span className="font-semibold text-slate-700">{project.name}</span></p>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-rose-200/60 rounded-2xl shadow-xl shadow-rose-200/20 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <form action={createIssue} className="space-y-7 relative z-10">
                    <input type="hidden" name="projectId" value={id} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                        <div className="space-y-2 group">
                            <label htmlFor="severity" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                ระดับความรุนแรง (Severity) <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="severity"
                                name="severity"
                                required
                                defaultValue="Medium"
                                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-slate-700 font-medium"
                            >
                                <option value="Low">Low (กระทบเล็กน้อย / เสนอแนะ)</option>
                                <option value="Medium">Medium (กระทบการใช้งานบางส่วน)</option>
                                <option value="High">High (ระบบพัง / ทำงานต่อไม่ได้)</option>
                            </select>
                        </div>
                        <div className="space-y-2 group">
                            <label htmlFor="assigneeId" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                ผู้รับผิดชอบแก้ไข (Assignee)
                            </label>
                            <select
                                id="assigneeId"
                                name="assigneeId"
                                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-slate-700 font-medium"
                            >
                                <option value="">-- ไม่ระบุ --</option>
                                {team.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label htmlFor="uatCaseId" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            พบปัญหาจากการทดสอบข้อไหน? (Traceability)
                        </label>
                        <select
                            id="uatCaseId"
                            name="uatCaseId"
                            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-slate-700 font-medium"
                        >
                            <option value="">-- พบจากการใช้งานทั่วไป / ไม่ระบุ --</option>
                            {uatCases.map((uat) => (
                                <option key={uat.id} value={uat.id}>
                                    [{uat.uatCode}] {uat.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2 group">
                        <label htmlFor="title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            รายละเอียดปัญหา <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id="title"
                            name="title"
                            rows={4}
                            placeholder="ระบุสิ่งที่พบ เทียบกับสิ่งที่คาดหวัง หรือขั้นตอนที่ทำให้เกิดบั๊ก..."
                            required
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-slate-700 font-medium resize-none"
                        ></textarea>
                    </div>

                    <div className="space-y-2 group">
                        <label htmlFor="attachments" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Paperclip size={16} className="text-rose-500" />
                            แนบไฟล์หลักฐาน (Attachments / Screenshots)
                        </label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 hover:border-rose-300 transition-all text-center p-4">
                            <input
                                type="file"
                                id="attachments"
                                name="attachments"
                                multiple
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 transition-colors cursor-pointer"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1 pl-1">สามารถเลือกได้หลายไฟล์ (ขนาดไม่เกิน 10MB/ไฟล์)</p>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="flex justify-end gap-3 pt-4">
                        <Link
                            href={`/projects/${id}?tab=issues`}
                            className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm hover:shadow"
                        >
                            ยกเลิก
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl hover:from-rose-700 hover:to-red-600 focus:ring-4 focus:ring-rose-500/30 transition-all shadow-md shadow-rose-500/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Bug size={18} />
                            บันทึก Issue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
