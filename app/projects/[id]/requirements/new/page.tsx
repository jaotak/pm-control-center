import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Paperclip } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";

export default async function NewRequirementPage({
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
    // Server Action สำหรับบันทึก Requirement
    // ----------------------------------------------------
    async function createRequirement(formData: FormData) {
        "use server";

        const reqCode = formData.get("reqCode") as string;
        const title = formData.get("title") as string;
        const assigneeId = formData.get("assigneeId") as string;
        const attachmentFiles = formData.getAll("attachments") as File[];

        if (!reqCode || !title) {
            throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
        }

        // Upload files if any
        const uploadedAttachments = [];
        for (const file of attachmentFiles) {
            if (file.size > 0) {
                const uploaded = await uploadFile(file);
                uploadedAttachments.push(uploaded);
            }
        }

        // บันทึกลงฐานข้อมูล โดยผูกกับ projectId
        await prisma.requirement.create({
            data: {
                reqCode,
                title,
                status: "Draft", // สถานะเริ่มต้นของ Requirement
                projectId: id,
                assigneeId: assigneeId || null,
                attachmentUrls: JSON.stringify(uploadedAttachments)
            },
        });

        // บันทึกเสร็จให้เด้งกลับไปหน้า Project Detail และเปิดแท็บ Requirements อัตโนมัติ
        redirect(`/projects/${id}?tab=requirements`);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href={`/projects/${id}?tab=requirements`}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">เพิ่ม Requirement ใหม่</h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
                <form action={createRequirement} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="reqCode" className="block text-sm font-medium text-gray-700">
                                รหัส Requirement (REQ Code) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="reqCode"
                                name="reqCode"
                                placeholder="เช่น REQ-001"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
                                ผู้รับผิดชอบ
                            </label>
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

                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            หัวข้อ (Title / Description) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="title"
                            name="title"
                            rows={3}
                            placeholder="ระบุความต้องการของระบบอย่างย่อ..."
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        ></textarea>
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">สามารถเลือกได้หลายไฟล์ (ขนาดไม่เกิน 10MB/ไฟล์)</p>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex justify-end gap-3 pt-2">
                        <Link
                            href={`/projects/${id}?tab=requirements`}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            ยกเลิก
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <Save size={18} />
                            บันทึก Requirement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}