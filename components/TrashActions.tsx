"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Trash2, Loader2 } from "lucide-react";
import { restoreItem, permanentlyDelete } from "@/app/actions/trash";

type ItemType = "req" | "uat" | "issue" | "task";

type Props = {
    itemId: string;
    type: ItemType;
    projectId: string;
};

export default function TrashActions({ itemId, type, projectId }: Props) {
    const [isPending, startTransition] = useTransition();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleRestore = () => {
        startTransition(async () => {
            await restoreItem(itemId, type, projectId);
        });
    };

    const handlePermanentDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000);
            return;
        }
        startTransition(async () => {
            await permanentlyDelete(itemId, type, projectId);
        });
    };

    return (
        <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
                onClick={handleRestore}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all disabled:opacity-60"
                title="กู้คืน"
            >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                กู้คืน
            </button>
            <button
                onClick={handlePermanentDelete}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all disabled:opacity-60 ${
                    confirmDelete
                        ? "text-white bg-rose-600 border-rose-700 hover:bg-rose-700 animate-pulse"
                        : "text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100"
                }`}
                title={confirmDelete ? "คลิกอีกครั้งเพื่อยืนยันการลบถาวร" : "ลบถาวร"}
            >
                <Trash2 size={12} />
                {confirmDelete ? "ยืนยันลบถาวร?" : "ลบถาวร"}
            </button>
        </div>
    );
}
