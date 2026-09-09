import CalendarView from "@/components/CalendarView";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function CalendarPage() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role || "USER";
    const userId = (session?.user as any)?.id;

    // 1. กรองงาน (Tasks) ตามสิทธิ์
    let taskCondition: any = {};
    if (role === "DEV") {
        taskCondition = { assigneeId: userId }; // DEV เห็นเฉพาะงานตัวเอง
    } else if (role === "PM") {
        taskCondition = {
            OR: [
                { assigneeId: userId },             // งานส่วนตัว & งานที่ได้รับมอบหมาย
                { project: { ownerId: userId } }    // งานของทุกคนในโปรเจกต์ที่ตัวเองเป็นเจ้าของ
            ]
        };
    } // ADMIN เห็นทั้งหมด

    const tasks = await prisma.task.findMany({
        where: taskCondition,
        include: {
            project: true,
            assignee: true // ดึงชื่อคนรับผิดชอบมาแสดงในปฏิทินด้วย
        }
    });

    // 2. กรองโปรเจกต์สำหรับ Dropdown สร้างงาน
    let projectCondition: any = {};
    if (role === "DEV") {
        projectCondition = { developers: { some: { id: userId } } };
    } else if (role === "PM") {
        projectCondition = { ownerId: userId };
    }

    const projects = await prisma.project.findMany({
        where: projectCondition,
        orderBy: { name: 'asc' }
    });

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