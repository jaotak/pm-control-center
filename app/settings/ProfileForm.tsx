"use client";

import { useState, startTransition } from "react";
import { updateProfile, changePassword, uploadAvatar } from "@/app/actions/user";
import { Save, CheckCircle2, AlertCircle, Camera, User } from "lucide-react";
import { useSession } from "next-auth/react";
import PasswordStrength from "@/components/PasswordStrength";

const DEPARTMENTS = ["Engineering", "QA", "Design", "Management", "Other"];

type UserProps = {
    id: string;
    name: string;
    email: string;
    department: string;
    phone: string;
    avatarUrl: string | null;
};

export default function ProfileForm({ user }: { user: UserProps }) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [department, setDepartment] = useState(user.department);
    const [phone, setPhone] = useState(user.phone);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [avatar, setAvatar] = useState(user.avatarUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const { update } = useSession();

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError("");
        setMessage("");
        
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const result = await uploadAvatar(formData);
            if (result?.avatarUrl) {
                setAvatar(result.avatarUrl);
                await update({ avatarUrl: result.avatarUrl });
                setMessage("อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว");
                setTimeout(() => setMessage(""), 4000);
            }
        } catch (err: any) {
            setError(err?.message || "เกิดข้อผิดพลาดในการอัปโหลดรูป");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setIsPending(true);

        startTransition(async () => {
            try {
                await updateProfile(name, email, department, phone);

                if (currentPassword && newPassword) {
                    const result = await changePassword(currentPassword, newPassword);
                    if (result?.error) {
                        setError(result.error);
                        setIsPending(false);
                        return;
                    }
                }

                setCurrentPassword("");
                setNewPassword("");
                setMessage("บันทึกข้อมูลเรียบร้อยแล้ว!");
                setTimeout(() => setMessage(""), 4000);
            } catch (err: any) {
                setError(err?.message || "เกิดข้อผิดพลาด");
            } finally {
                setIsPending(false);
            }
        });
    };

    return (
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            {message && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 size={16} />
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2 animate-in fade-in duration-200">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Avatar Upload Section */}
            <div className="flex items-center gap-5 pb-4 border-b border-slate-100">
                <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md shadow-slate-200/50 bg-slate-100 flex items-center justify-center">
                        {avatar ? (
                            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={32} className="text-slate-400" />
                        )}
                    </div>
                    <label className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${isUploading ? 'opacity-100 cursor-not-allowed' : ''}`}>
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Camera size={20} className="text-white" />
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploading} />
                    </label>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800">รูปโปรไฟล์ (Profile Picture)</h3>
                    <p className="text-xs text-slate-500 mt-1">อัปโหลดรูปภาพเพื่อให้ทีมจำคุณได้ง่ายขึ้น</p>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">ชื่อที่แสดง (Display Name)</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">อีเมล / Username</label>
                <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                />
            </div>

            {/* Department & Phone */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">แผนก / Department</label>
                    <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all appearance-none cursor-pointer"
                    >
                        <option value="">-- ไม่ระบุ --</option>
                        {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">เบอร์โทร</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08x-xxx-xxxx"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                    />
                </div>
            </div>

            {/* Password Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">เปลี่ยนรหัสผ่าน <span className="text-slate-400 font-normal lowercase">(ทิ้งว่างไว้ถ้าไม่ต้องการเปลี่ยน)</span></p>

                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">รหัสผ่านปัจจุบัน (Current Password)</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่านปัจจุบัน"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">รหัสผ่านใหม่ (New Password)</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-800 font-medium transition-all"
                    />
                    <PasswordStrength password={newPassword} />
                </div>
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all hover:scale-105"
                >
                    <Save size={16} /> {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
            </div>
        </form>
    );
}