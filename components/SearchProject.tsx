"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef, useState } from "react";

export default function SearchProject() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const initialQuery = searchParams.get("q")?.toString() || "";
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const triggerSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        const trimmed = term.trim();
        if (trimmed) {
            params.set("q", trimmed);
        } else {
            params.delete("q");
        }

        startTransition(() => {
            router.replace(`/projects?${params.toString()}`);
        });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            triggerSearch(value);
        }, 250);
    };

    const handleClear = () => {
        setSearchTerm("");
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        triggerSearch("");
    };

    return (
        <div className={`flex items-center bg-slate-100/80 px-3.5 py-2 rounded-xl w-full md:w-80 border border-slate-200/80 transition-all ${isPending ? 'opacity-70' : 'opacity-100'} focus-within:border-emerald-500 focus-within:bg-white focus-within:shadow-xs`}>
            <Search size={17} className="text-slate-400 shrink-0" />
            <input
                type="text"
                placeholder="ค้นหา Code, ชื่อโครงการ, ลูกค้า..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="bg-transparent border-none outline-none ml-2.5 w-full text-xs text-slate-700 placeholder-slate-400"
            />
            {searchTerm && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 hover:bg-slate-200/70 rounded-md text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    title="ล้างคำค้นหา"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}