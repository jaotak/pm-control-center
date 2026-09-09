"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProject } from "@/app/actions/project";

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (window.confirm("คำเตือนระดับสูง: ยืนยันการลบโครงการนี้?\n\nข้อมูล Requirements, UAT, Issues และ Tasks ทั้งหมดในโครงการนี้จะถูก 'ลบถาวร' และไม่สามารถกู้คืนได้!")) {
            startTransition(() => {
                deleteProject(projectId);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium text-sm rounded-lg border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
            <Trash2 size={16} />
            {isPending ? "กำลังลบ..." : "ลบโครงการ"}
        </button>
    );
}