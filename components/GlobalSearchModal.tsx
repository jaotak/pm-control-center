"use client";

import { useState, useEffect } from "react";
import { Search, X, Folder, ListTodo, TestTube, AlertCircle, CheckSquare, Sparkles } from "lucide-react";
import Link from "next/link";

type SearchResult = {
    id: string;
    title: string;
    code: string;
    type: string;
    icon: string;
    link: string;
};

export default function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setResults([]);
            return;
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.results);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 250);
        return () => clearTimeout(timeoutId);
    }, [query]);

    if (!isOpen) return null;

    const renderIcon = (type: string) => {
        if (type === 'Project') return <Folder size={16} className="text-indigo-600" />;
        if (type === 'Requirement') return <ListTodo size={16} className="text-emerald-600" />;
        if (type === 'UAT') return <TestTube size={16} className="text-purple-600" />;
        if (type === 'Issue') return <AlertCircle size={16} className="text-rose-600" />;
        return <CheckSquare size={16} className="text-amber-600" />;
    };

    const getTypeBadgeStyle = (type: string) => {
        if (type === 'Project') return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
        if (type === 'Requirement') return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
        if (type === 'UAT') return 'bg-purple-50 text-purple-700 border-purple-200/60';
        if (type === 'Issue') return 'bg-rose-50 text-rose-700 border-rose-200/60';
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-start justify-center z-50 pt-16 md:pt-24 px-4 transition-all">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">

                {/* Input Header */}
                <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
                    <Search size={20} className="text-slate-400 shrink-0 ml-1" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ค้นหา ID, ชื่องาน, Requirement, บั๊ก (พิมพ์อย่างน้อย 2 ตัวอักษร)..."
                        className="w-full bg-transparent border-none outline-none px-3.5 text-slate-800 text-sm placeholder-slate-400 font-medium"
                        autoFocus
                    />
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl shrink-0 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search Results Content */}
                <div className="overflow-y-auto p-3 bg-slate-50/30 flex-1 min-h-[280px] custom-scrollbar">
                    {isLoading && (
                        <div className="text-center py-12 text-slate-400 text-sm flex items-center justify-center gap-2">
                            <Sparkles size={18} className="animate-spin text-indigo-500" />
                            <span>กำลังค้นหาข้อมูล...</span>
                        </div>
                    )}

                    {!isLoading && query.length >= 2 && results.length === 0 && (
                        <div className="text-center py-12 text-slate-500 text-sm">
                            ไม่พบข้อมูลที่ตรงกับ <span className="font-semibold text-slate-800">&ldquo;{query}&rdquo;</span>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="space-y-1.5">
                            {results.map((item) => (
                                <Link
                                    key={`${item.type}-${item.id}`}
                                    href={item.link}
                                    onClick={onClose}
                                    className="flex items-center gap-3.5 p-3 bg-white hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200/80 rounded-xl transition-all group shadow-2xs hover:shadow-xs"
                                >
                                    <div className="w-9 h-9 bg-slate-50 group-hover:bg-white rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs">
                                        {renderIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                            <span className="font-semibold text-slate-700">{item.code}</span>
                                            <span>•</span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTypeBadgeStyle(item.type)}`}>
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!isLoading && query.length < 2 && (
                        <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-2.5">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                <Search size={22} />
                            </div>
                            <p className="font-medium text-slate-600">พิมพ์คำค้นหาที่คุณต้องการ</p>
                            <span className="text-xs text-slate-400">ค้นหาได้ทั้ง รหัสโปรเจกต์, Requirement, UAT, บั๊ก และ Task</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}