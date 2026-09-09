"use client";

import { useState, useTransition } from "react";
import { Clock, CheckCircle2, X } from "lucide-react";
import { logTime } from "@/app/actions/task";

type Props = {
    taskId: string;
    taskTitle: string;
    estimatedHours: number | null;
    loggedHours: number | null;
};

export default function TimeTracker({ taskId, taskTitle, estimatedHours, loggedHours }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [hours, setHours] = useState("0.5");
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);

    const logged = loggedHours ?? 0;
    const estimated = estimatedHours ?? 0;
    const percent = estimated > 0 ? Math.min((logged / estimated) * 100, 100) : 0;
    const isOverBudget = estimated > 0 && logged > estimated;

    const handleLog = () => {
        const h = parseFloat(hours);
        if (isNaN(h) || h <= 0) return;
        startTransition(async () => {
            await logTime(taskId, h);
            setSaved(true);
            setTimeout(() => { setSaved(false); setIsOpen(false); }, 1500);
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-slate-500 transition-all"
                title="Log Time"
            >
                <Clock size={13} />
                {estimated > 0 ? `${logged.toFixed(1)}h / ${estimated}h` : "Log Time"}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200/80 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Clock size={16} className="text-indigo-600" />
                                Log Time — {taskTitle}
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors">
                                <X size={17} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {estimated > 0 && (
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-slate-600">Progress</span>
                                        <span className={isOverBudget ? "text-rose-600" : "text-indigo-600"}>
                                            {logged.toFixed(1)}h / {estimated}h
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${isOverBudget ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-blue-600"}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    {isOverBudget && (
                                        <p className="text-[11px] text-rose-600 font-bold mt-1">⚠ เกิน Estimate แล้ว</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    เพิ่มเวลา (ชั่วโมง)
                                </label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-semibold transition-all"
                                />
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors">
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleLog}
                                disabled={isPending}
                                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all"
                            >
                                {saved ? <><CheckCircle2 size={14} /> บันทึกแล้ว!</> : isPending ? "กำลังบันทึก..." : <><Clock size={14} /> บันทึกเวลา</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
