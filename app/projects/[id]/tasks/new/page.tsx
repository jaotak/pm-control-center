import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckSquare } from "lucide-react";
import { updateProjectProgress } from "@/app/actions/progress";

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
        await updateProjectProgress(id);

        redirect(`/projects/${id}?tab=tasks`);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/projects/${id}?tab=tasks`} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">เพิ่มรายการงาน (To-Do)</h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
                <form action={createTask} className="space-y-6">

                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">ชื่องาน <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="เช่น รวบรวมเอกสาร, เตรียมประชุม..."
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">วันครบกำหนด (ไม่บังคับ)</label>
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">ผู้รับผิดชอบ</label>
                            <select
                                id="assigneeId"
                                name="assigneeId"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">-- ไม่ระบุ --</option>
                                {team.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex justify-end gap-3 pt-2">
                        <Link href={`/projects/${id}?tab=tasks`} className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</Link>
                        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                            <CheckSquare size={18} /> บันทึก Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}