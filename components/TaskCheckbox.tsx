"use client"; // ประกาศว่าเป็น Client Component เพื่อให้ใช้ useState และ onClick ได้

import { useState, useTransition } from "react";
import { toggleTaskStatus } from "@/app/actions/task";

export default function TaskCheckbox({
    taskId,
    initialCompleted,
    title,
}: {
    taskId: string;
    initialCompleted: boolean;
    title: string;
}) {
    // เก็บสถานะไว้ใน Component เพื่อให้อัปเดต UI ได้ทันทีที่กด (Optimistic Update)
    const [isCompleted, setIsCompleted] = useState(initialCompleted);
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setIsCompleted(checked); // 1. เปลี่ยน UI ให้ขีดฆ่าทันทีโดยไม่ต้องรอโหลด

        // 2. แอบส่งข้อมูลไปอัปเดต Database เบื้องหลัง
        startTransition(async () => {
            const res = await toggleTaskStatus(taskId, checked);
            if (res?.error) {
                alert(res.error);
                setIsCompleted(!checked); // revert
            }
        });
    };

    return (
        <div className="flex items-center gap-3">
            <input
                type="checkbox"
                checked={isCompleted}
                onChange={handleChange}
                disabled={isPending}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            />
            <span
                className={`font-medium transition-all duration-300 ${isCompleted ? "line-through text-gray-400" : "text-gray-800"
                    }`}
            >
                {title}
            </span>
        </div>
    );
}