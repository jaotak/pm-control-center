import CalendarView from "@/components/CalendarView";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function CalendarPage() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || "USER";
    const userId = session?.user?.id as string;

    // 1. กรองงาน (Tasks) ตามสิทธิ์ (เฉพาะที่ยังไม่ถูกลบ และมีกำหนดวันส่ง)
    let roleTaskCondition: Prisma.TaskWhereInput = {};
    if (role === "DEV") {
        roleTaskCondition = { assigneeId: userId! }; // DEV เห็นเฉพาะงานตัวเอง
    } else if (role === "PM") {
        roleTaskCondition = {
            OR: [
                { assigneeId: userId! },             // งานส่วนตัว & งานที่ได้รับมอบหมาย
                { project: { ownerId: userId! } }    // งานของทุกคนในโปรเจกต์ที่ตัวเองเป็นเจ้าของ
            ]
        };
    }

    const taskCondition = {
        deletedAt: null,
        ...roleTaskCondition
    };

    // 2. กรองโปรเจกต์สำหรับ Dropdown สร้างงาน
    let projectCondition: Prisma.ProjectWhereInput = {};
    if (role === "DEV") {
        projectCondition = { developers: { some: { id: userId } } };
    } else if (role === "PM") {
        projectCondition = { ownerId: userId };
    }

    // Parallel fetch tasks and projects concurrently in a single round-trip
    const [tasks, projects] = await Promise.all([
        prisma.task.findMany({
            where: taskCondition,
            select: {
                id: true,
                title: true,
                dueDate: true,
                isCompleted: true,
                project: {
                    select: { id: true, name: true, code: true }
                },
                assignee: {
                    select: { id: true, name: true }
                }
            }
        }),
        prisma.project.findMany({
            where: projectCondition,
            select: {
                id: true,
                name: true,
                code: true
            },
            orderBy: { name: 'asc' }
        })
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        ปฏิทินแสดงกำหนดการและงานที่ต้องรับผิดชอบ
                    </p>
                </div>
            </div>

            <div className="flex-1">
                {/* ส่งข้อมูล tasks, projects และ role เข้าไปใน CalendarView */}
                <CalendarView tasks={tasks} projects={projects} userRole={role} currentUserId={userId} />
            </div>
        </div>
    );
}
