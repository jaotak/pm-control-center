"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const PRIORITIES = ["Critical", "High", "Normal", "Low"];

type TeamMember = { id: string; name: string };

type Props = {
    statusOptions: string[];
    teamMembers: TeamMember[];
    currentUserId: string;
};

export default function FilterBar({ statusOptions, teamMembers, currentUserId }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const tab = searchParams.get("tab") || "overview";
    const filterStatus = searchParams.get("filterStatus") || "";
    const filterPriority = searchParams.get("filterPriority") || "";
    const filterAssignee = searchParams.get("filterAssignee") || "";
    const filterDue = searchParams.get("filterDue") || "";

    const hasFilters = !!(filterStatus || filterPriority || filterAssignee || filterDue);

    const updateFilter = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const clearFilters = () => {
        router.push(`${pathname}?tab=${tab}`, { scroll: false });
    };

    return (
        <div className="flex flex-wrap items-center gap-2 bg-slate-50/60 border border-slate-200/60 rounded-2xl px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                <SlidersHorizontal size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Filter</span>
            </div>

            <select
                value={filterStatus}
                onChange={(e) => updateFilter("filterStatus", e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
                <option value="">All Statuses</option>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
                value={filterPriority}
                onChange={(e) => updateFilter("filterPriority", e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
                <option value="">All Priorities</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select
                value={filterAssignee}
                onChange={(e) => updateFilter("filterAssignee", e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
                <option value="">All Assignees</option>
                <option value={currentUserId}>My Items</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <select
                value={filterDue}
                onChange={(e) => updateFilter("filterDue", e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
                <option value="">Any Due Date</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="week">Due This Week</option>
                <option value="none">No Due Date</option>
            </select>

            {hasFilters && (
                <button
                    onClick={clearFilters}
                    className="ml-1 flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                >
                    <X size={12} /> Clear Filters
                </button>
            )}

            {hasFilters && (
                <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Filters active
                </span>
            )}
        </div>
    );
}
