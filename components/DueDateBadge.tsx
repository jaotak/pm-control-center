"use client";

import { AlertTriangle } from "lucide-react";

export default function DueDateBadge({ dueDate }: { dueDate: Date | string | null }) {
    if (!dueDate) {
        return <span className="text-[11px] text-slate-400 font-medium">—</span>;
    }

    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now;

    const formatted = date.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
    });

    if (isOverdue) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle size={10} />
                Overdue · {formatted}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {formatted}
        </span>
    );
}
