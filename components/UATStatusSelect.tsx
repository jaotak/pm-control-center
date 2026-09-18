"use client";

import { useState, useTransition } from "react";
import { updateUatStatus } from "@/app/actions/update";

export default function UATStatusSelect({ uatId, initialStatus, projectId }: { uatId: string, initialStatus: string, projectId: string }) {
    const [status, setStatus] = useState(initialStatus);
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        startTransition(async () => {
            const res = await updateUatStatus(uatId, newStatus, projectId);
            if (res?.error) {
                alert(res.error);
                setStatus(status); // revert
            }
        });
    };

    const colorClass =
        status === "Passed" ? "bg-green-100 text-green-700 border-green-200" :
            status === "Failed" ? "bg-red-100 text-red-700 border-red-200" :
                "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <select
            value={status}
            onChange={handleChange}
            disabled={isPending}
            className={`text-xs font-semibold px-2 py-1 rounded-full outline-none cursor-pointer border text-center appearance-none transition-colors ${colorClass} disabled:opacity-50`}
        >
            <option value="Pending">Pending</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
        </select>
    );
}