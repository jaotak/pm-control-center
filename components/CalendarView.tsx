"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import Link from "next/link";
import { createGlobalTask } from "@/app/actions/task";
import { deleteTask } from "@/app/actions/delete"; // 1. นำเข้า Action สำหรับลบงาน

type Task = {
    id: string;
    title: string;
    dueDate: Date | null;
    isCompleted: boolean;
    project: { id: string; name: string; code: string } | null;
    assignee: { id: string; name: string } | null;
};

type Project = { id: string; name: string; code: string };

export default function CalendarView({
    tasks,
    projects,
    userRole,
    currentUserId // 2. รับค่า ID ของคนที่ล็อกอินอยู่
}: {
    tasks: Task[],
    projects: Project[],
    userRole: string,
    currentUserId: string
}) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [taskTitle, setTaskTitle] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [isPending, startTransition] = useTransition();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));

    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const weekDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

    const openAddModal = (date: Date) => {
        setSelectedDate(date);
        setTaskTitle("");
        setSelectedProjectId("");
        setIsModalOpen(true);
    };

    const handleSaveTask = () => {
        if (!taskTitle.trim() || !selectedDate) return;
        startTransition(() => {
            createGlobalTask(taskTitle, selectedDate.toISOString(), selectedProjectId);
            setIsModalOpen(false);
        });
    };

    // 3. ฟังก์ชันสำหรับลบงาน (ดักไม่ให้ทะลุไปกด Link)
    const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("ยืนยันการลบงานนี้?")) {
            startTransition(() => {
                deleteTask(taskId);
            });
        }
    };

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[600px]">

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {monthNames[month]} {year + 543}
                    </h2>
                    <div className="flex items-center gap-4">
                        <button onClick={goToday} className="text-sm font-medium text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors">
                            วันนี้
                        </button>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"><ChevronLeft size={20} /></button>
                            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex flex-col">
                        <div className="min-w-[800px] flex-1 flex flex-col">
                            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 shrink-0">
                                {weekDays.map((day, index) => (
                                    <div key={day} className={`text-center py-3 text-xs font-semibold ${index === 0 || index === 6 ? 'text-gray-400' : 'text-gray-600'}`}>{day}</div>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-200">
                                <div className="grid grid-cols-7 gap-px auto-rows-[minmax(120px,_1fr)] min-h-full">
                                    {calendarDays.map((day, index) => {
                                        if (!day) return <div key={`empty-${index}`} className="bg-gray-50/50 min-h-[120px]"></div>;

                                        const dayString = formatDate(day);
                                        const isToday = formatDate(today) === dayString;
                                        const dayTasks = tasks.filter(t => t.dueDate && formatDate(t.dueDate) === dayString);

                                        return (
                                            <div key={dayString} className="bg-white p-1.5 hover:bg-gray-50 transition-colors flex flex-col group relative min-h-[120px]">
                                                <div className="flex justify-between items-start mb-1 shrink-0">
                                                    <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-red-500 text-white font-bold shadow-sm" : "text-gray-700 font-medium group-hover:text-green-600"}`}>
                                                        {day.getDate()}
                                                    </span>
                                                    <button onClick={() => openAddModal(day)} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                                                        <Plus size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                                                    {dayTasks.map(task => (
                                                        /* 4. ครอบ Link ด้วย div group/task เพื่อจัดการแสดงผลปุ่มลบ */
                                                        <div key={task.id} className="relative group/task">
                                                            <Link
                                                                href={task.project ? `/projects/${task.project.id}?tab=tasks` : '/tasks'}
                                                                className={`block px-2 py-1.5 text-xs rounded border pr-6 ${task.isCompleted ? "bg-gray-100 text-gray-400 border-gray-200 line-through" : task.project ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100" : "bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100"}`}
                                                            >
                                                                <div className="truncate font-medium">
                                                                    <span className="font-bold mr-1">{task.project ? task.project.code : '🎯 ทั่วไป'}</span>
                                                                    {task.title}
                                                                </div>
                                                                {task.assignee && (
                                                                    <div className="mt-0.5 text-[10px] opacity-75 flex items-center gap-1 truncate">
                                                                        👤 {task.assignee.name.split(' ')[0]}
                                                                    </div>
                                                                )}
                                                            </Link>

                                                            {/* 5. ปุ่มกากบาทลบงาน (โผล่เฉพาะตอนเอาเมาส์ชี้ และต้องเป็นเจ้าของงาน หรือ Admin/PM) */}
                                                            {(task.assignee?.id === currentUserId || userRole !== "DEV") && (
                                                                <button
                                                                    onClick={(e) => handleDeleteTask(e, task.id)}
                                                                    className="absolute top-1.5 right-1.5 p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover/task:opacity-100 transition-opacity"
                                                                    title="ลบงานนี้"
                                                                >
                                                                    <X size={12} strokeWidth={3} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && selectedDate && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-lg">สร้าง Task ใหม่</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                                📅 วันที่กำหนด: {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">ผูกกับโครงการ (ไม่บังคับ)</label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                >
                                    <option value="">-- 🎯 งานทั่วไป (ไม่ระบุโครงการ) --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">รายละเอียดงาน</label>
                                <input
                                    type="text"
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    placeholder="เช่น ตรวจสอบความถูกต้อง, ประชุมอัปเดต..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">ยกเลิก</button>
                            <button onClick={handleSaveTask} disabled={isPending || !taskTitle.trim()} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
                                {isPending ? "กำลังบันทึก..." : "บันทึกและรับผิดชอบ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}