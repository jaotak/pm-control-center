"use client";

import { useState, useTransition } from "react";
import {
    updateRequirementStatus,
    updateUatStatus,
    updateIssueStatus,
} from "@/app/actions/update";
import { ITEM_STATUSES, ItemStatusKind, statusSelectClass } from "@/lib/itemStatus";

type Props = {
    kind: ItemStatusKind;
    itemId: string;
    projectId: string;
    initialStatus: string;
};

export default function StatusSelect({ kind, itemId, projectId, initialStatus }: Props) {
    const [status, setStatus] = useState(initialStatus);
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const previous = status;
        const next = e.target.value;
        setStatus(next);
        startTransition(async () => {
            const res =
                kind === "req"
                    ? await updateRequirementStatus(itemId, next, projectId)
                    : kind === "uat"
                        ? await updateUatStatus(itemId, next, projectId)
                        : await updateIssueStatus(itemId, next, projectId);
            if (res && "error" in res && res.error) {
                alert(res.error);
                setStatus(previous);
            }
        });
    };

    return (
        <select
            value={status}
            onChange={handleChange}
            disabled={isPending}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full outline-none cursor-pointer border text-center appearance-none transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 ${statusSelectClass(status)}`}
        >
            {ITEM_STATUSES[kind].map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}
