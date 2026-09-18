import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Calendar, UserCircle2 } from "lucide-react";
import { updateProjectProgress, logActivity } from "@/lib/progress";
import { requireProjectAccess } from "@/lib/auth";

export default async function NewTaskPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: { owner: true, developers: true }
    });

    if (!project) return <div>Project not found</div>;

    const team = [];
    if (project.owner) team.push(project.owner);
    project.developers.forEach(dev => team.push(dev));

    // ----------------------------------------------------
    // Server Action สำหรับบันทึก Task
    // ----------------------------------------------------
    async function createTask(formData: FormData) {
        "use server";
        const user = await requireProjectAccess(id);

        const title = formData.get("title") as string;
        const dueDateInput = formData.get("dueDate") as string;
        const assigneeId = formData.get("assigneeId") as string;

        if (!title) {
            throw new Error("กรุณากรอกชื่องาน");
        }

        // แปลงวันที่ ถ้ามีการกรอกเข้ามา
        let dueDate = null;
        if (dueDateInput) {
            dueDate = new Date(dueDateInput);
        }

        // บันทึกลงตาราง Task
        await prisma.task.create({
            data: {
                title,
                dueDate,
                projectId: id,
                assigneeId: assigneeId || null,
            },
        });
        
        await logActivity(id, user.id, `เพิ่มงานใหม่: "${title}"`);
        await updateProjectProgress(id);

        redirect(`/projects/${id}?tab=tasks`);
    }

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4 mb-2">
                <Link 
                    href={`/projects/${id}?tab=tasks`} 
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full transition-all text-slate-500 hover:text-slate-700 shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        เพิ่มรายการงาน (To-Do)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">โครงการ: <span className="font-semibold text-slate-700">{project.name}</span></p>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-emerald-200/60 rounded-2xl shadow-xl shadow-emerald-200/20 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <form action={createTask} className="space-y-7 relative z-10">
                    <div className="space-y-2 group">
                        <label htmlFor="title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            ชื่องาน <span className="text-emerald-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="เช่น รวบรวมเอกสาร, เตรียมประชุม..."
                            required
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                        <div className="space-y-2 group">
                            <label htmlFor="dueDate" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={14} className="text-emerald-500" />
                                วันครบกำหนด (ไม่บังคับ)
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label htmlFor="assigneeId" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <UserCircle2 size={14} className="text-emerald-500" />
                                ผู้รับผิดชอบ
                            </label>
                            <select
                                id="assigneeId"
                                name="assigneeId"
                                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium"
                            >
                                <option value="">-- ไม่ระบุ --</option>
                                {team.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="flex justify-end gap-3 pt-4">
                        <Link 
                            href={`/projects/${id}?tab=tasks`} 
                            className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm hover:shadow"
                        >
                            ยกเลิก
                        </Link>
                        <button 
                            type="submit" 
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <CheckSquare size={18} /> บันทึก Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}