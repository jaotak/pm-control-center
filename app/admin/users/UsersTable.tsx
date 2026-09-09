"use client";

import { useState, useTransition } from "react";
import { Users, Shield, KeyRound, UserX, UserCheck, Plus, X, Save } from "lucide-react";
import { updateUserRole, toggleUserActive, adminResetPassword, adminCreateUser } from "@/app/actions/admin";

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    _count: { projectsOwned: number; projectsAssigned: number };
};

const ROLES = ["ADMIN", "PM", "DEV"];

const roleColors: Record<string, string> = {
    ADMIN: "bg-rose-50 text-rose-700 border-rose-200",
    PM: "bg-indigo-50 text-indigo-700 border-indigo-200",
    DEV: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function UsersTable({ users: initial }: { users: User[] }) {
    const [users, setUsers] = useState(initial);
    const [isPending, startTransition] = useTransition();
    const [resetTarget, setResetTarget] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "DEV" });
    const [feedback, setFeedback] = useState("");

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(""), 3000);
    };

    const handleRoleChange = (userId: string, role: string) => {
        startTransition(async () => {
            await updateUserRole(userId, role);
            setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x));
            showFeedback("Role updated");
        });
    };

    const handleToggleActive = (userId: string, isActive: boolean) => {
        startTransition(async () => {
            await toggleUserActive(userId, !isActive);
            setUsers(u => u.map(x => x.id === userId ? { ...x, isActive: !isActive } : x));
        });
    };

    const handleResetPassword = () => {
        if (!resetTarget || !newPassword) return;
        startTransition(async () => {
            await adminResetPassword(resetTarget, newPassword);
            setResetTarget(null);
            setNewPassword("");
            showFeedback("Password reset successfully");
        });
    };

    const handleCreateUser = () => {
        startTransition(async () => {
            const res = await adminCreateUser(createForm.name, createForm.email, createForm.password, createForm.role);
            if ((res as any)?.error) {
                showFeedback((res as any).error);
            } else {
                setShowCreate(false);
                setCreateForm({ name: "", email: "", password: "", role: "DEV" });
                showFeedback("User created!");
                window.location.reload();
            }
        });
    };

    return (
        <div className="space-y-4">
            {feedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl">{feedback}</div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                    <Plus size={15} /> Create User
                </button>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-xs font-extrabold uppercase tracking-wider">
                            <th className="px-5 py-3.5">User</th>
                            <th className="px-5 py-3.5">Role</th>
                            <th className="px-5 py-3.5 text-center">Projects</th>
                            <th className="px-5 py-3.5 text-center">Status</th>
                            <th className="px-5 py-3.5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className={`hover:bg-slate-50/60 transition-colors ${!u.isActive ? "opacity-50" : ""}`}>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <select
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        disabled={isPending}
                                        className={`text-xs font-extrabold px-2.5 py-1.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer ${roleColors[u.role] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                                    >
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <div className="text-xs font-bold text-slate-700">
                                        <span className="text-indigo-600">{u._count.projectsOwned}</span> PM
                                        <span className="text-slate-400 mx-1">·</span>
                                        <span className="text-emerald-600">{u._count.projectsAssigned}</span> DEV
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <button
                                        onClick={() => handleToggleActive(u.id, u.isActive)}
                                        disabled={isPending}
                                        className={`flex items-center gap-1 mx-auto text-[11px] font-bold px-3 py-1 rounded-xl border transition-all ${u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"}`}
                                    >
                                        {u.isActive ? <><UserCheck size={12} /> Active</> : <><UserX size={12} /> Inactive</>}
                                    </button>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <button
                                        onClick={() => setResetTarget(u.id)}
                                        className="flex items-center gap-1 mx-auto text-[11px] font-bold px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all"
                                    >
                                        <KeyRound size={12} /> Reset PW
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Reset Password Modal */}
            {resetTarget && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200/80 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><KeyRound size={16} className="text-amber-600" /> Reset Password</h3>
                            <button onClick={() => setResetTarget(null)}><X size={17} className="text-slate-400" /></button>
                        </div>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="รหัสผ่านใหม่..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setResetTarget(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">ยกเลิก</button>
                            <button onClick={handleResetPassword} disabled={isPending} className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                                <Save size={14} /> Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200/80 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Plus size={16} className="text-indigo-600" /> Create New User</h3>
                            <button onClick={() => setShowCreate(false)}><X size={17} className="text-slate-400" /></button>
                        </div>
                        <div className="p-5 space-y-3">
                            {(["name", "email", "password"] as const).map(field => (
                                <div key={field}>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{field}</label>
                                    <input
                                        type={field === "password" ? "password" : "text"}
                                        value={createForm[field]}
                                        onChange={e => setCreateForm(f => ({ ...f, [field]: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Role</label>
                                <select
                                    value={createForm.role}
                                    onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="px-5 py-3.5 border-t border-slate-100 flex gap-2 justify-end">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">ยกเลิก</button>
                            <button onClick={handleCreateUser} disabled={isPending} className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50">
                                <Plus size={14} /> Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
