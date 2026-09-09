"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const result = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        if (result?.error) {
            // Parse specific error types from the auth callback
            if (result.error.includes("PENDING_APPROVAL")) {
                setError("บัญชีของคุณยังรอการอนุมัติจากผู้ดูแลระบบ กรุณารอสักครู่");
            } else if (result.error.includes("ACCOUNT_DEACTIVATED")) {
                setError("บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
            } else {
                setError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
            }
            setIsLoading(false);
        } else {
            window.location.href = "/";
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 z-[100]">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/25 hover:scale-110 transition-transform">
                        <FolderKanban size={28} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">PM Control Center</h1>
                    <p className="text-sm text-slate-500 mt-1">เข้าสู่ระบบเพื่อจัดการโครงการ</p>
                </div>

                {/* Error */}
                {error && (
                    <div className={`px-4 py-3 rounded-xl text-sm mb-6 border font-semibold animate-in slide-in-from-top-2 duration-200 ${
                        error.includes("รอการอนุมัติ")
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : error.includes("ระงับ")
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                    }`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            อีเมล / Username
                        </label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="กรอกอีเมลหรือ username"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            รหัสผ่าน
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="กรอกรหัสผ่าน"
                                className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> กำลังตรวจสอบ...</>
                        ) : (
                            <>เข้าสู่ระบบ <ArrowRight size={16} /></>
                        )}
                    </button>
                </form>

                {/* Register link */}
                <div className="text-center mt-6 pt-5 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        ยังไม่มีบัญชี?{" "}
                        <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors">
                            สมัครสมาชิก
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}