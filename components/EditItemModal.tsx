"use client";

import { useState, useTransition } from "react";
import { Edit, X, Save } from "lucide-react";
import { editRequirement, editUATCase, editIssue } from "@/app/actions/edit";

const PRIORITIES = ["Critical", "High", "Normal", "Low"];

type EditModalProps = {
    type: 'req' | 'uat' | 'issue';
    item: { id: string; title: string; detail: string | null; priority?: string; dueDate?: string };
    projectId: string;
};

export default function EditItemModal({ type, item, projectId }: EditModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState(item.title);
    const [detail, setDetail] = useState(item.detail || "");
    const [priority, setPriority] = useState(item.priority || "Normal");
    const [dueDate, setDueDate] = useState(item.dueDate || "");
    const [isPending, startTransition] = useTransition();

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            if (type === 'req') editRequirement(item.id, title, detail, projectId, priority, dueDate || null);
            if (type === 'uat') editUATCase(item.id, title, detail, projectId, priority, dueDate || null);
            if (type === 'issue') editIssue(item.id, title, detail, projectId, priority, dueDate || null);
            setIsOpen(false);
        });
    };

    const getDetailLabel = () => {
        if (type === 'req') return "รายละเอียด Requirement (Description)";
        if (type === 'uat') return "ผลลัพธ์ที่คาดหวัง (Expected Result)";
        return "ขั้นตอนที่ทำให้เกิดบั๊ก (Steps to Reproduce)";
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors mr-1"
                title="แก้ไขข้อมูล"
            >
                <Edit size={16} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-base">แก้ไขข้อมูล</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">หัวข้อ (Title)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 font-medium transition-all"
                                        >
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Due Date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 font-medium transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{getDetailLabel()}</label>
                                    <textarea
                                        value={detail}
                                        onChange={(e) => setDetail(e.target.value)}
                                        rows={5}
                                        placeholder="ใส่รายละเอียดเพิ่มเติมที่นี่..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 resize-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all"
                                >
                                    <Save size={15} /> {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}