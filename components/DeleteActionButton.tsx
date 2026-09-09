"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteRequirement, deleteUAT, deleteIssue } from "@/app/actions/deleteItems";

export default function DeleteActionButton({
    id,
    projectId,
    type
}: {
    id: string,
    projectId: string,
    type: 'req' | 'uat' | 'issue'
}) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm(`ยืนยันการลบทิ้ง? ข้อมูลที่เกี่ยวข้องกันจะถูกลบออกไปด้วย และไม่สามารถกู้คืนได้`)) {
            startTransition(() => {
                if (type === 'req') deleteRequirement(id, projectId);
                if (type === 'uat') deleteUAT(id, projectId);
                if (type === 'issue') deleteIssue(id, projectId);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="ลบข้อมูลนี้"
        >
            <Trash2 size={16} />
        </button>
    );
}