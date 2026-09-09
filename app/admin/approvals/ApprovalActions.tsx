"use client";

import { useState, useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";

type Props = {
    userId: string;
    userName: string;
};

async function approveUser(userId: string) {
    const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "approve" }),
    });
    return res.json();
}

async function rejectUser(userId: string) {
    const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reject" }),
    });
    return res.json();
}

export default function ApprovalActions({ userId, userName }: Props) {
    const [isPending, startTransition] = useTransition();
    const [done, setDone] = useState<"approved" | "rejected" | null>(null);
    const [confirmReject, setConfirmReject] = useState(false);

    const handleApprove = () => {
        startTransition(async () => {
            await approveUser(userId);
            setDone("approved");
        });
    };

    const handleReject = () => {
        if (!confirmReject) {
            setConfirmReject(true);
            setTimeout(() => setConfirmReject(false), 3000);
            return;
        }
        startTransition(async () => {
            await rejectUser(userId);
            setDone("rejected");
        });
    };

    if (done === "approved") {
        return (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                ✓ อนุมัติแล้ว
            </span>
        );
    }
    if (done === "rejected") {
        return (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                ✗ ปฏิเสธแล้ว
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2 shrink-0">
            <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all disabled:opacity-60 shadow-2xs"
            >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                อนุมัติ
            </button>
            <button
                onClick={handleReject}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all disabled:opacity-60 shadow-2xs ${
                    confirmReject
                        ? "text-white bg-rose-600 border-rose-700 hover:bg-rose-700 animate-pulse"
                        : "text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100"
                }`}
            >
                <X size={13} />
                {confirmReject ? "ยืนยันปฏิเสธ?" : "ปฏิเสธ"}
            </button>
        </div>
    );
}
