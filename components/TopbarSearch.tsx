"use client";

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TopbarSearch() {
    const router = useRouter();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // เมื่อผู้ใช้กดปุ่ม Enter
        if (e.key === 'Enter') {
            const val = e.currentTarget.value;
            if (val.trim()) {
                router.push(`/projects?q=${encodeURIComponent(val)}`);
            } else {
                router.push(`/projects`);
            }
        }
    };

    return (
        <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg w-full md:w-96 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
            <Search size={18} className="text-gray-400" />
            <input
                type="text"
                placeholder="ค้นหาโครงการ (กด Enter เพื่อค้นหา)..."
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none ml-2 w-full text-sm text-gray-700 placeholder-gray-400"
            />
        </div>
    );
}