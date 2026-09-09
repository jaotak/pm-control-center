import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckSquare, AlertCircle, TestTube, ListTodo, Calendar, ArrowRight } from "lucide-react";
import TaskCheckbox from "@/components/TaskCheckbox";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DeleteTaskButton from "@/components/DeleteTaskButton";

export default async function MyTasksPage() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role || "USER";

    let taskCondition: any = {};
    if (role === "DEV") {
        taskCondition = { assigneeId: userId };
    } else if (role === "PM") {
        taskCondition = {
            OR: [
                { assigneeId: userId },
                { project: { ownerId: userId } }
            ]
        };
    }

    const tasks = await prisma.task.findMany({
        where: taskCondition,
        orderBy: [
            { isCompleted: 'asc' },
            { dueDate: 'asc' }
        ],
        include: { project: true }
    });

    const pendingTasks = tasks.filter(t => !t.isCompleted);
    const completedTasks = tasks.filter(t => t.isCompleted);

    const assignedIssues = await prisma.issue.findMany({
        where: { assigneeId: userId, status: { notIn: ["Resolved", "Closed"] } },
        include: { project: true }
    });

    const assignedUATs = await prisma.uATCase.findMany({
        where: { assigneeId: userId, status: { notIn: ["Passed"] } },
        include: { project: true }
    });

    const assignedReqs = await prisma.requirement.findMany({
        where: { assigneeId: userId, status: { notIn: ["Done"] } },
        include: { project: true }
    });

    return (
        <div className="max-w-5xl mx-auto space-y-7 pb-12">
            {/* Title Banner Header */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-8 flex items-center gap-4">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/80 shadow-2xs">
                    <CheckSquare size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Tasks & Work Overview</h1>
                    <p className="text-xs text-slate-500 mt-1">รายการงาน, บั๊ก และหน้าที่ทั้งหมดที่คุณได้รับมอบหมาย</p>
                </div>
            </div>

            {/* Assigned Main Modules Section */}
            {(assignedIssues.length > 0 || assignedUATs.length > 0 || assignedReqs.length > 0) && (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-7">
                    <h2 className="text-base font-extrabold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center justify-between">
                        <span>โมดูลหลักที่ได้รับมอบหมาย (Assigned Modules)</span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                            {assignedIssues.length + assignedUATs.length + assignedReqs.length} รายการ
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Issues */}
                        {assignedIssues.length > 0 && (
                            <div className="space-y-2.5">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                                    <AlertCircle size={15} /> บั๊กที่ต้องแก้ไข (Issues - {assignedIssues.length})
                                </h3>
                                <div className="space-y-2">
                                    {assignedIssues.map(issue => (
                                        <Link
                                            key={issue.id}
                                            href={`/projects/${issue.projectId}?tab=issues`}
                                            className="block bg-rose-50/60 border border-rose-200/80 p-3.5 rounded-2xl hover:bg-rose-100/70 transition-all group shadow-2xs"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-slate-800 text-xs leading-snug group-hover:text-rose-700 transition-colors">
                                                    [{issue.issueCode}] {issue.title}
                                                </span>
                                                <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-md font-extrabold shrink-0 ml-2">
                                                    {issue.severity}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 flex justify-between mt-2 font-medium">
                                                <span>โครงการ: <strong>{issue.project.code}</strong></span>
                                                <span className="font-bold text-rose-600">{issue.status}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* UAT */}
                        {assignedUATs.length > 0 && (
                            <div className="space-y-2.5">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                                    <TestTube size={15} /> ทดสอบระบบ (UAT - {assignedUATs.length})
                                </h3>
                                <div className="space-y-2">
                                    {assignedUATs.map(uat => (
                                        <Link
                                            key={uat.id}
                                            href={`/projects/${uat.projectId}?tab=uat`}
                                            className="block bg-purple-50/60 border border-purple-200/80 p-3.5 rounded-2xl hover:bg-purple-100/70 transition-all group shadow-2xs"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-slate-800 text-xs leading-snug group-hover:text-purple-700 transition-colors">
                                                    [{uat.uatCode}] {uat.title}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 flex justify-between mt-2 font-medium">
                                                <span>โครงการ: <strong>{uat.project.code}</strong></span>
                                                <span className="font-bold text-purple-600">{uat.status}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {assignedReqs.length > 0 && (
                            <div className="md:col-span-2 space-y-2.5">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                    <ListTodo size={15} /> พัฒนา Requirement ({assignedReqs.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {assignedReqs.map(req => (
                                        <Link
                                            key={req.id}
                                            href={`/projects/${req.projectId}?tab=requirements`}
                                            className="block bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-2xl hover:bg-emerald-100/70 transition-all group shadow-2xs"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-slate-800 text-xs leading-snug group-hover:text-emerald-700 transition-colors">
                                                    [{req.reqCode}] {req.title}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 flex justify-between mt-2 font-medium">
                                                <span>โครงการ: <strong>{req.project.code}</strong></span>
                                                <span className="font-bold text-emerald-600">{req.status}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* General Tasks List Container */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-7">
                <h2 className="text-base font-extrabold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>รายการงานทั่วไป (Tasks - {pendingTasks.length})</span>
                </h2>

                <div className="space-y-3 mb-10">
                    {pendingTasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/80 transition-all"
                        >
                            <div className="mb-2 sm:mb-0">
                                <TaskCheckbox taskId={task.id} initialCompleted={task.isCompleted} title={task.title} />
                                <div className="text-xs text-slate-500 mt-1.5 ml-8 font-medium">
                                    โครงการ: {task.project ? (
                                        <Link href={`/projects/${task.projectId}?tab=tasks`} className="text-indigo-600 hover:underline font-bold">
                                            {task.project.name}
                                        </Link>
                                    ) : (
                                        <span className="text-purple-600 font-bold">🎯 งานทั่วไป (General)</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-8 sm:ml-0">
                                <div className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl">
                                    {task.dueDate ? `กำหนด: ${new Date(task.dueDate).toLocaleDateString('th-TH')}` : 'ไม่มีกำหนด'}
                                </div>
                                {(task.assigneeId === userId || role !== "DEV") && (
                                    <DeleteTaskButton taskId={task.id} />
                                )}
                            </div>
                        </div>
                    ))}
                    {pendingTasks.length === 0 && (
                        <div className="p-10 text-center text-sm font-semibold text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                            ไม่มีรายการ Task ค้าง ยอดเยี่ยมมาก! 🎉
                        </div>
                    )}
                </div>

                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
                    งานที่เสร็จสิ้นแล้ว ({completedTasks.length})
                </h2>
                <div className="space-y-2.5 opacity-70">
                    {completedTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-slate-50/60">
                            <TaskCheckbox taskId={task.id} initialCompleted={task.isCompleted} title={task.title} />
                            <div className="text-xs font-medium text-slate-400 hidden sm:block">
                                {task.project ? task.project.name : '🎯 งานทั่วไป (General)'}
                            </div>
                        </div>
                    ))}
                    {completedTasks.length === 0 && (
                        <p className="text-slate-400 text-xs text-center py-2">ยังไม่มีงานที่ทำเสร็จ</p>
                    )}
                </div>
            </div>
        </div>
    );
}