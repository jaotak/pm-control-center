"use client";

import { useState, useTransition } from "react";
import { FolderKanban, UserPlus, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { registerUser } from "@/app/actions/register";
import PasswordStrength from "@/components/PasswordStrength";

const DEPARTMENTS = ["Engineering", "QA", "Design", "Management", "Other"];

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        department: "",
        phone: "",
    });

    const update = (key: string, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Client-side validation
        if (form.password.length < 6) {
            setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
            return;
        }

        startTransition(async () => {
            const result = await registerUser(form);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(true);
            }
        });
    };

    if (success) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 z-[100]">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                </div>
                <div className="relative bg-white/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 text-center">
                    <div className="w-16 h-16 mx-auto mb-5 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={36} className="text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 mb-2">ลงทะเบียนสำเร็จ!</h2>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        บัญชีของคุณถูกสร้างเรียบร้อยแล้ว<br />
                        กรุณารอผู้ดูแลระบบ (Admin) อนุมัติก่อนเข้าสู่ระบบ
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
                    >
                        กลับสู่หน้าเข้าสู่ระบบ <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 z-[100]">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex flex-col items-center mb-7">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/25">
                        <FolderKanban size={28} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">สมัครสมาชิก</h1>
                    <p className="text-sm text-slate-500 mt-1">สร้างบัญชีเพื่อเข้าใช้งาน PM Control Center</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm mb-5 border border-rose-200 font-semibold animate-in slide-in-from-top-2 duration-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            placeholder="เช่น สมชาย ใจดี"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            อีเมล / Username <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="email@example.com"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            รหัสผ่าน <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={form.password}
                                onChange={(e) => update("password", e.target.value)}
                                placeholder="อย่างน้อย 6 ตัวอักษร"
                                className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <PasswordStrength password={form.password} />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={form.confirmPassword}
                            onChange={(e) => update("confirmPassword", e.target.value)}
                            placeholder="กรอกรหัสผ่านอีกครั้ง"
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all ${
                                form.confirmPassword && form.confirmPassword !== form.password
                                    ? "border-rose-300 bg-rose-50/30"
                                    : "border-slate-200"
                            }`}
                        />
                        {form.confirmPassword && form.confirmPassword !== form.password && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1">รหัสผ่านไม่ตรงกัน</p>
                        )}
                    </div>

                    {/* Department & Phone row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                แผนก / Department
                            </label>
                            <select
                                value={form.department}
                                onChange={(e) => update("department", e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all appearance-none cursor-pointer"
                            >
                                <option value="">-- เลือก --</option>
                                {DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                เบอร์โทร
                            </label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => update("phone", e.target.value)}
                                placeholder="08x-xxx-xxxx"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <><Loader2 size={16} className="animate-spin" /> กำลังสร้างบัญชี...</>
                        ) : (
                            <><UserPlus size={16} /> สมัครสมาชิก</>
                        )}
                    </button>
                </form>

                {/* Login link */}
                <div className="text-center mt-6 pt-5 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        มีบัญชีอยู่แล้ว?{" "}
                        <Link href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors">
                            เข้าสู่ระบบ
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
