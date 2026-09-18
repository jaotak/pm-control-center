"use client";

import { useTransition } from "react";
import { linkRequirementToUat, linkUatToIssue } from "@/app/actions/update";

type Option = { id: string; label: string };

export default function TraceabilityLinkSelect({
    mode,
    itemId,
    projectId,
    currentId,
    options,
    disabled,
}: {
    mode: "uat-req" | "issue-uat";
    itemId: string;
    projectId: string;
    currentId: string | null;
    options: Option[];
    disabled?: boolean;
}) {
    const [isPending, startTransition] = useTransition();

    return (
        <select
            defaultValue={currentId ?? ""}
            disabled={disabled || isPending}
            onChange={(e) => {
                const value = e.target.value || null;
                startTransition(async () => {
                    if (mode === "uat-req") await linkRequirementToUat(itemId, value, projectId);
                    else await linkUatToIssue(itemId, value, projectId);
                });
            }}
            className="max-w-[140px] text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            title={mode === "uat-req" ? "ผูกกับ Requirement" : "ผูกกับ UAT"}
        >
            <option value="">{mode === "uat-req" ? "ไม่ผูก REQ" : "ไม่ผูก UAT"}</option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
        </select>
    );
}
