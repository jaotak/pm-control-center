import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function ForbiddenPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="p-5 bg-rose-50 text-rose-500 rounded-3xl border border-rose-200/80 mb-6">
                <ShieldAlert size={52} />
            </div>
            <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-2">403</h1>
            <h2 className="text-xl font-bold text-slate-700 mb-3">Access Forbidden</h2>
            <p className="text-sm text-slate-500 max-w-sm mb-8">
                คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อ Admin หากคุณเชื่อว่านี่คือข้อผิดพลาด
            </p>
            <Link
                href="/"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md shadow-indigo-500/20 hover:scale-105 transition-all"
            >
                <ArrowLeft size={16} />
                กลับไปหน้าหลัก
            </Link>
        </div>
    );
}
