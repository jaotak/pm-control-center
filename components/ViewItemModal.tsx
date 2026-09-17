"use client";

import { useState } from "react";
import { Eye, X, Paperclip, Download } from "lucide-react";

type ViewModalProps = {
    type: 'req' | 'uat' | 'issue';
    item: {
        code: string;
        title: string;
        detail: string | null;
        status: string;
        extra?: string;
        attachmentUrls?: string;
    };
};

export default function ViewItemModal({ type, item }: ViewModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const getDetailLabel = () => {
        if (type === 'req') return "รายละเอียด (Description)";
        if (type === 'uat') return "ผลลัพธ์ที่คาดหวัง (Expected Result)";
        return "ขั้นตอนที่ทำให้เกิดบั๊ก (Steps to Reproduce)";
    };

    const getBadgeColor = () => {
        if (type === 'issue') return "bg-rose-50 text-rose-700 border-rose-200";
        if (type === 'uat') return "bg-teal-50 text-teal-700 border-teal-200";
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    };

    let attachments: { url: string; name: string; type?: string; size?: number }[] = [];
    if (item.attachmentUrls) {
        try {
            attachments = JSON.parse(item.attachmentUrls);
        } catch (e) {
            console.error("Failed to parse attachments", e);
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                title="ดูรายละเอียด"
            >
                <Eye size={16} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getBadgeColor()}`}>
                                    {item.code}
                                </span>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200/60">
                                    สถานะ: {item.status}
                                </span>
                                {item.extra && (
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg">
                                        {item.extra}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">หัวข้อ (Title)</h4>
                                <p className="text-slate-900 font-bold text-lg leading-snug">{item.title}</p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{getDetailLabel()}</h4>
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 min-h-[120px] text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                                    {item.detail ? item.detail : <span className="text-slate-400 italic">ไม่มีการระบุรายละเอียดเพิ่มเติม</span>}
                                </div>
                            </div>

                            {attachments.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1"><Paperclip size={14}/> ไฟล์แนบ (Attachments)</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {attachments.map((file, idx: number) => {
                                            const isImage = file.type?.startsWith('image/');
                                            return (
                                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center justify-center p-2 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-emerald-300 transition-all overflow-hidden w-24 h-24">
                                                    {isImage ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={file.url} alt={file.name} className="object-cover w-full h-full rounded-lg" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-emerald-500">
                                                            <Download size={24} />
                                                            <span className="text-[10px] truncate w-full text-center mt-1 px-1">{file.name}</span>
                                                        </div>
                                                    )}
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}