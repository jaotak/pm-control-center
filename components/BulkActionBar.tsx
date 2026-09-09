"use client";

import { useState, useTransition } from "react";
import { CheckSquare, ChevronDown, X, Loader2 } from "lucide-react";
import {
    bulkUpdateRequirementStatus,
    bulkUpdateUatStatus,
    bulkUpdateIssueStatus,
} from "@/app/actions/update";

type ItemType = "req" | "uat" | "issue";

const STATUS_OPTIONS: Record<ItemType, string[]> = {
    req:   ["Draft", "In Review", "Approved", "Done"],
    uat:   ["Pending", "In Progress", "Passed", "Failed"],
    issue: ["Open", "In Progress", "Testing", "Resolved", "Closed"],
};

type Props = {
    type: ItemType;
    projectId: string;
    selectedIds: string[];
    onClear: () => void;
};

export default function BulkActionBar({ type, projectId, selectedIds, onClear }: Props) {
    const [status, setStatus] = useState("");
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);

    if (selectedIds.length === 0) return null;

    const applyBulk = () => {
        if (!status) return;
        startTransition(async () => {
            if (type === "req") await bulkUpdateRequirementStatus(selectedIds, status, projectId);
            else if (type === "uat") await bulkUpdateUatStatus(selectedIds, status, projectId);
            else await bulkUpdateIssueStatus(selectedIds, status, projectId);
            setSuccess(true);
            setTimeout(() => { setSuccess(false); onClear(); }, 1200);
        });
    };

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 animate-in slide-in-from-bottom-2 duration-200">
            <CheckSquare size={16} className="shrink-0" />
            <span className="text-xs font-bold">{selectedIds.length} รายการที่เลือก</span>

            <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="appearance-none pl-3 pr-7 py-1.5 bg-white/20 border border-white/30 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                    >
                        <option value="" disabled className="text-slate-800">เปลี่ยนสถานะเป็น...</option>
                        {STATUS_OPTIONS[type].map(s => (
                            <option key={s} value={s} className="text-slate-800">{s}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                    onClick={applyBulk}
                    disabled={!status || isPending}
                    className="px-3 py-1.5 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 disabled:opacity-60 transition-all flex items-center gap-1.5"
                >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                    {success ? "✓ สำเร็จ!" : "บันทึก"}
                </button>

                <button onClick={onClear} className="p-1 hover:bg-white/20 rounded-lg transition-colors" title="ยกเลิกการเลือก">
                    <X size={15} />
                </button>
            </div>
        </div>
    );
}
