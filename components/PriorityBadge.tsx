"use client";

const PRIORITY_CONFIG: Record<string, { label: string; classes: string }> = {
    Critical: { label: "Critical", classes: "bg-rose-50 text-rose-700 border-rose-200" },
    High:     { label: "High",     classes: "bg-amber-50 text-amber-700 border-amber-200" },
    Normal:   { label: "Normal",   classes: "bg-slate-100 text-slate-600 border-slate-200" },
    Low:      { label: "Low",      classes: "bg-sky-50 text-sky-700 border-sky-200" },
};

export default function PriorityBadge({ priority }: { priority: string }) {
    const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.Normal;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${cfg.classes}`}>
            {cfg.label}
        </span>
    );
}
