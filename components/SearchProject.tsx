"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function SearchProject() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        const params = new URLSearchParams(searchParams);

        if (term) {
            params.set("q", term); // ถ้าพิมพ์ ให้เซ็ตค่า q
        } else {
            params.delete("q"); // ถ้าลบข้อความออกหมด ให้เอา q ออกจาก URL
        }

        // อัปเดต URL โดยไม่รีเฟรชหน้าเว็บทั้งหน้า
        startTransition(() => {
            router.replace(`/projects?${params.toString()}`);
        });
    };

    return (
        <div className={`flex items-center bg-gray-100 px-3 py-2 rounded-lg w-full md:w-80 border transition-all ${isPending ? 'opacity-70' : 'opacity-100'} focus-within:border-blue-500 focus-within:bg-white`}>
            <Search size={18} className="text-gray-400" />
            <input
                type="text"
                placeholder="ค้นหา Code, ชื่อโครงการ, ลูกค้า..."
                defaultValue={searchParams.get("q")?.toString()}
                onChange={handleSearch}
                className="bg-transparent border-none outline-none ml-2 w-full text-sm text-gray-700 placeholder-gray-400"
            />
        </div>
    );
}