"use client"; // ต้องเป็น Client Component เพื่อรับ Event onChange

import { useState, useTransition } from "react";
import { updateIssueStatus } from "@/app/actions/issue";

export default function IssueStatusSelect({
    issueId,
    initialStatus,
}: {
    issueId: string;
    initialStatus: string;
}) {
    const [status, setStatus] = useState(initialStatus);
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus); // อัปเดตหน้าจอทันทีที่เลือก

        // แอบส่งข้อมูลไปอัปเดต Database เบื้องหลัง
        startTransition(async () => {
            const res = await updateIssueStatus(issueId, newStatus, "");
            if (res?.error) {
                alert(res.error);
                setStatus(status); // revert
            }
        });
    };

    // กำหนดสีของ Dropdown ตามสถานะ
    const getColorClass = () => {
        switch (status) {
            case "Open": return "bg-red-50 text-red-700 border-red-200";
            case "In Progress": return "bg-amber-50 text-amber-700 border-amber-200";
            case "Resolved": return "bg-green-50 text-green-700 border-green-200";
            case "Closed": return "bg-gray-100 text-gray-500 border-gray-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <select
            value={status}
            onChange={handleChange}
            disabled={isPending}
            className={`text-xs font-semibold px-2 py-1 rounded-full outline-none cursor-pointer border text-center appearance-none transition-colors ${getColorClass()} disabled:opacity-50`}
        >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
        </select>
    );
}