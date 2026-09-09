import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bug, Paperclip } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";


export default async function NewIssuePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    // 1. ดึง UAT Cases ทั้งหมดของโปรเจกต์นี้มาทำ Dropdown
    const uatCases = await prisma.uATCase.findMany({
        where: { projectId: id },
        orderBy: { uatCode: 'asc' }
    });

    const project = await prisma.project.findUnique({
        where: { id },
        include: { owner: true, developers: true }
    });

    if (!project) return <div>Project not found</div>;

    const team = [];
    if (project.owner) team.push(project.owner);
    project.developers.forEach(dev => team.push(dev));

    // ----------------------------------------------------
    // Server Action สำหรับบันทึก Issue
    // ----------------------------------------------------
    async function createIssue(formData: FormData) {
        "use server";

        const issueCode = formData.get("issueCode") as string;
        const title = formData.get("title") as string;
        const severity = formData.get("severity") as string;

        // 2. รับค่า UAT Case ที่ผูกกับ Issue นี้
        const uatCaseId = formData.get("uatCaseId") as string;
        const assigneeId = formData.get("assigneeId") as string;
        const attachmentFiles = formData.getAll("attachments") as File[];

        if (!issueCode || !title || !severity) {
            throw new Error("กรุณากรอกข้อมูลปัญหาให้ครบถ้วน");
        }

        const uploadedAttachments = [];
        for (const file of attachmentFiles) {
            if (file && file.size > 0) {
                const uploaded = await uploadFile(file);
                uploadedAttachments.push(uploaded);
            }
        }

        // 3. บันทึกลงตาราง Issue
        await prisma.issue.create({
            data: {
                issueCode,
                title,
                severity,
                status: "Open",
                projectId: id,
                uatCaseId: uatCaseId ? uatCaseId : null,
                assigneeId: assigneeId ? assigneeId : null,
                attachmentUrls: JSON.stringify(uploadedAttachments)
            },
        });
        // บันทึกเสร็จให้เด้งกลับและเปิดแท็บ Issues
        redirect(`/projects/${id}?tab=issues`);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href={`/projects/${id}?tab=issues`}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">แจ้งปัญหา (Log Issue)</h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
                <form action={createIssue} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="issueCode" className="block text-sm font-medium text-gray-700">
                                รหัสปัญหา (Issue Code) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="issueCode"
                                name="issueCode"
                                placeholder="เช่น BUG-001"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                                ระดับความรุนแรง (Severity) <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="severity"
                                name="severity"
                                required
                                defaultValue="Medium"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                            >
                                <option value="Low">Low (กระทบเล็กน้อย / เสนอแนะ)</option>
                                <option value="Medium">Medium (กระทบการใช้งานบางส่วน)</option>
                                <option value="High">High (ระบบพัง / ทำงานต่อไม่ได้)</option>
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
                                ผู้รับผิดชอบแก้ไข (Assignee)
                            </label>
                            <select
                                id="assigneeId"
                                name="assigneeId"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
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
                            รายละเอียดปัญหา <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="title"
                            name="title"
                            rows={4}
                            placeholder="ระบุสิ่งที่พบ เทียบกับสิ่งที่คาดหวัง หรือขั้นตอนที่ทำให้เกิดบั๊ก..."
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        ></textarea>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Paperclip size={16} className="text-gray-500" />
                            แนบไฟล์หลักฐาน (Attachments / Screenshots)
                        </label>
                        <input
                            type="file"
                            id="attachments"
                            name="attachments"
                            multiple
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">สามารถเลือกได้หลายไฟล์ (ขนาดไม่เกิน 10MB/ไฟล์)</p>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="flex justify-end gap-3 pt-2">
                        <Link
                            href={`/projects/${id}?tab=issues`}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            ยกเลิก
                        </Link>
                        <div className="space-y-2">
                            <label htmlFor="uatCaseId" className="block text-sm font-medium text-gray-700">
                                พบปัญหาจากการทดสอบข้อไหน? (Traceability)
                            </label>
                            <select
                                id="uatCaseId"
                                name="uatCaseId"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                            >
                                <option value="">-- พบจากการใช้งานทั่วไป / ไม่ระบุ --</option>
                                {uatCases.map((uat) => (
                                    <option key={uat.id} value={uat.id}>
                                        [{uat.uatCode}] {uat.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
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