"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTask } from "@/app/actions/delete";

export default function DeleteTaskButton({ taskId }: { taskId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        // แสดงหน้าต่างยืนยันก่อนลบจริง
        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? ข้อมูลจะถูกลบถาวร")) {
            startTransition(() => {
                deleteTask(taskId);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="ลบงาน"
        >
            <Trash2 size={18} />
        </button>
    );
}