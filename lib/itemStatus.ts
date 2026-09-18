export const ITEM_STATUSES = {
    req: ["Draft", "In Progress", "In Review", "Approved", "Done"],
    uat: ["Pending", "In Progress", "Passed", "Failed"],
    issue: ["Open", "In Progress", "Testing", "Resolved", "Closed"],
} as const;

export type ItemStatusKind = keyof typeof ITEM_STATUSES;

const STATUS_CLASS: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    Pending: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    Open: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    "In Review": "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    Approved: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    Testing: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    Passed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    Done: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    Closed: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    Failed: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
};

export function assertAllowedStatus(kind: ItemStatusKind, status: string) {
    const allowed = ITEM_STATUSES[kind] as readonly string[];
    if (!allowed.includes(status)) {
        throw new Error(`Invalid ${kind} status: ${status}`);
    }
}

export function statusSelectClass(status: string) {
    return STATUS_CLASS[status] ?? STATUS_CLASS.Draft;
}
