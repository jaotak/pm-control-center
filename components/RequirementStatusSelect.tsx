"use client";

import { useState, useTransition } from "react";
import { updateRequirementStatus } from "@/app/actions/requirement";

export default function RequirementStatusSelect({ reqId, initialStatus }: { reqId: string, initialStatus: string }) {
    const [status, setStatus] = useState(initialStatus);
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        startTransition(async () => {
            const res = await updateRequirementStatus(reqId, newStatus);
            if (res?.error) {
                alert(res.error);
                setStatus(status); // revert to old status
            }
        });
    };

    const colorClass =
        status === "Done" ? "bg-green-100 text-green-700 border-green-200" :
            status === "In Progress" ? "bg-blue-100 text-blue-700 border-blue-200" :
                "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <select
            value={status}
            onChange={handleChange}
            disabled={isPending}
            className={`text-xs font-semibold px-2 py-1 rounded-full outline-none cursor-pointer border text-center appearance-none transition-colors ${colorClass} disabled:opacity-50`}
        >
            <option value="Draft">Draft</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
        </select>
    );
}