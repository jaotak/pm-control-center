"use client";

import { useState } from "react";
import { assignProjectOwner, addDeveloperToProject, removeDeveloperFromProject } from "@/app/actions/team";
import { UserPlus, Shield, UserMinus } from "lucide-react";

type User = { id: string; name: string; email: string; role: string };

export default function TeamManagement({
    projectId,
    currentOwnerId,
    assignedDevs,
    allUsers,
    userRole
}: {
    projectId: string;
    currentOwnerId: string | null;
    assignedDevs: User[];
    allUsers: User[];
    userRole: string;
}) {
    const [selectedDevId, setSelectedDevId] = useState("");

    const pms = allUsers.filter(u => u.role === "PM" || u.role === "ADMIN");
    const devs = allUsers.filter(u => u.role === "DEV");
    const availableDevs = devs.filter(d => !assignedDevs.some(ad => ad.id === d.id));

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" />
                การจัดการทีมและผู้รับผิดชอบ (Team & Roles)
            </h2>

            {/* ส่วนที่ 1: สำหรับ ADMIN กำหนด PM */}
            {userRole === "ADMIN" && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2">
                    <label className="block text-sm font-bold text-amber-900">👑 ผู้ดูแลโครงการ (Project Manager) - เฉพาะ Admin กำหนด</label>
                    <select
                        defaultValue={currentOwnerId || ""}
                        onChange={(e) => assignProjectOwner(projectId, e.target.value)}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white text-sm outline-none"
                    >
                        <option value="">-- ยังไม่ระบุ PM --</option>
                        {pms.map(pm => (
                            <option key={pm.id} value={pm.id}>{pm.name} ({pm.email})</option>
                        ))}
                    </select>
                </div>
            )}

            {/* ส่วนที่ 2: สำหรับ PM ดึงตัว Dev เข้าโปรเจกต์ */}
            {(userRole === "PM" || userRole === "ADMIN") && (
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-800">💻 ทีม Developer ในโปรเจกต์นี้</label>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <select
                            value={selectedDevId}
                            onChange={(e) => setSelectedDevId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                        >
                            <option value="">-- เลือก Developer ที่ต้องการดึงเข้าโปรเจกต์ --</option>
                            {availableDevs.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                if (selectedDevId) {
                                    addDeveloperToProject(projectId, selectedDevId);
                                    setSelectedDevId("");
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5 transition-colors whitespace-nowrap shrink-0"
                        >
                            <UserPlus size={16} /> ดึงตัวเข้าทีม
                        </button>
                    </div>
                </div>
            )}

            {/* รายชื่อ Dev ที่อยู่ในทีมตอนนี้ */}
            <div className="border-t pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Devs ที่ปฏิบัติงานในโปรเจกต์นี้ ({assignedDevs.length})</h3>
                <div className="space-y-2">
                    {assignedDevs.map(dev => (
                        <div key={dev.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">{dev.name} <span className="text-xs text-gray-400">({dev.email})</span></span>

                            {(userRole === "PM" || userRole === "ADMIN") && (
                                <button
                                    onClick={() => removeDeveloperFromProject(projectId, dev.id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                    title="เอาออกจากโปรเจกต์"
                                >
                                    <UserMinus size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                    {assignedDevs.length === 0 && (
                        <p className="text-xs text-gray-400 italic">ยังไม่มี Developer ในโปรเจกต์นี้</p>
                    )}
                </div>
            </div>
        </div>
    );
}