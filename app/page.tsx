import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderKanban, CheckSquare, AlertCircle, Clock, ArrowRight, Sparkles, TrendingUp, TestTube } from "lucide-react";
import TaskCheckbox from "@/components/TaskCheckbox";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UATPassRateDonut from "@/components/UATPassRateDonut";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "USER";
  const userId = (session?.user as any)?.id;

  let projectCondition: any = {};
  if (role === "PM") {
    projectCondition = { ownerId: userId };
  } else if (role === "DEV") {
    projectCondition = { developers: { some: { id: userId } } };
  }

  let taskCondition: any = {};
  if (role === "PM") {
    taskCondition = {
      OR: [
        { project: { ownerId: userId } },
        { assigneeId: userId, projectId: null }
      ]
    };
  } else if (role === "DEV") {
    taskCondition = { assigneeId: userId };
  }

  let issueCondition: any = {};
  if (role === "PM") {
    issueCondition = { project: { ownerId: userId } };
  } else if (role === "DEV") {
    issueCondition = { project: { developers: { some: { id: userId } } } };
  }

  const myTaskCondition = { assigneeId: userId };

  // Parallelised queries — all 5 run concurrently
  const [
    totalProjects,
    pendingTasks,
    openIssues,
    recentProjects,
    upcomingTasks,
    uatCases,
  ] = await Promise.all([
    prisma.project.count({ where: projectCondition }),
    prisma.task.count({ where: { isCompleted: false, deletedAt: null, ...taskCondition } }),
    prisma.issue.count({ where: { status: { notIn: ["Closed", "Resolved"] }, deletedAt: null, ...issueCondition } }),
    prisma.project.findMany({
      where: projectCondition,
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { owner: true }
    }),
    prisma.task.findMany({
      where: { isCompleted: false, deletedAt: null, ...myTaskCondition },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { project: true }
    }),
    // UAT data for the pass rate widget on the dashboard
    prisma.uATCase.findMany({
      where: { deletedAt: null, ...(role !== "ADMIN" ? { project: projectCondition } : {}) },
      select: { status: true }
    }),
  ]);

  const uatStats = [
    { name: "Passed",      value: uatCases.filter(u => u.status === "Passed").length,      color: "#10b981" },
    { name: "Failed",      value: uatCases.filter(u => u.status === "Failed").length,      color: "#f43f5e" },
    { name: "Pending",     value: uatCases.filter(u => u.status === "Pending").length,     color: "#94a3b8" },
    { name: "In Progress", value: uatCases.filter(u => u.status === "In Progress").length, color: "#8b5cf6" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-10">

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 p-6 md:p-8 rounded-3xl shadow-xl text-white border border-slate-800">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles size={14} /> Overview &amp; Performance
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              ยินดีต้อนรับกลับมา, <span className="font-semibold text-white">{session?.user?.name}</span> 👋 ติดตามความคืบหน้าของโครงการและงานค้างทั้งหมดได้ที่นี่
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
            >
              + ดูโครงการทั้งหมด
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover-lift flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">โครงการของคุณ</div>
            <div className="text-3xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{totalProjects}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp size={13} className="text-emerald-500" /> Active Projects
            </div>
          </div>
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
            <FolderKanban size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover-lift flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">งานค้าง (Pending)</div>
            <div className="text-3xl font-extrabold text-slate-800 group-hover:text-amber-600 transition-colors">{pendingTasks}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <Clock size={13} className="text-amber-500" /> Action required
            </div>
          </div>
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
            <CheckSquare size={26} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover-lift flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">บั๊กที่ยังไม่แก้ (Issues)</div>
            <div className="text-3xl font-extrabold text-slate-800 group-hover:text-rose-600 transition-colors">{openIssues}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle size={13} className="text-rose-500" /> Requires attention
            </div>
          </div>
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-xs">
            <AlertCircle size={26} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Projects Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FolderKanban size={19} className="text-indigo-600" />
              โปรเจกต์ที่ใช้งานล่าสุด
            </h2>
            <Link href="/projects" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
              ดูทั้งหมด <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="p-3 divide-y divide-slate-100 flex-1">
            {recentProjects.map(prj => (
              <Link
                key={prj.id}
                href={`/projects/${prj.id}`}
                className="flex items-center justify-between p-3.5 hover:bg-indigo-50/40 rounded-xl transition-all group"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors truncate">
                    {prj.name} <span className="text-xs font-semibold text-slate-400 ml-1">({prj.code})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>PM: <strong className="text-slate-700">{prj.owner ? prj.owner.name : 'ยังไม่ระบุ'}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200/60">
                    {prj.stage}
                  </span>
                  <div className="w-16">
                    <div className="flex justify-end text-[11px] font-bold text-indigo-600 mb-1">{prj.progress}%</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${prj.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {recentProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <FolderKanban size={28} className="text-slate-300" />
                </div>
                <div className="text-sm font-medium text-slate-500">ไม่พบโปรเจกต์ที่คุณรับผิดชอบ</div>
                <div className="text-xs text-slate-400 mt-1">เริ่มต้นสร้างโปรเจกต์ใหม่เพื่อติดตามความคืบหน้า</div>
              </div>
            )}
          </div>
        </div>

        {/* UAT Pass Rate Widget */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <TestTube size={19} className="text-purple-600" />
              UAT Pass Rate
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">ภาพรวม Test Cases ทั้งหมด</p>
          </div>
          <div className="p-4 flex-1 flex flex-col items-center justify-center">
            {uatCases.length > 0 ? (
              <>
                <UATPassRateDonut data={uatStats} />
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 w-full px-2">
                  {uatStats.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="font-medium">{s.name}:</span>
                      <span className="font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 text-sm py-8">
                <TestTube size={32} className="mx-auto mb-2 opacity-30" />
                ยังไม่มี UAT Cases
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Clock size={19} className="text-amber-500" />
            งานของคุณ (Upcoming Tasks)
          </h2>
          <Link href="/tasks" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
            ดูทั้งหมด <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="p-4 space-y-2.5 flex-1">
          {upcomingTasks.map(task => (
            <div
              key={task.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition-all hover:border-slate-200"
            >
              <div className="mb-2 sm:mb-0 min-w-0">
                <TaskCheckbox taskId={task.id} initialCompleted={task.isCompleted} title={task.title} />
                <div className="text-xs text-slate-500 mt-1.5 ml-8">
                  {task.project ? (
                    <>โครงการ: <Link href={`/projects/${task.projectId}?tab=tasks`} className="text-indigo-600 hover:underline font-semibold">{task.project.code}</Link></>
                  ) : (
                    <span className="text-purple-600 font-semibold">🎯 งานทั่วไป</span>
                  )}
                </div>
              </div>
              <div className="text-[11px] font-bold text-slate-600 ml-8 sm:ml-0 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg w-fit shrink-0">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : 'ไม่มีกำหนด'}
              </div>
            </div>
          ))}
          {upcomingTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center p-10 text-center h-full">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <CheckSquare size={28} className="text-emerald-300" />
              </div>
              <div className="text-sm font-medium text-slate-500">ไม่มีงานค้าง เยี่ยมมาก! 🎉</div>
              <div className="text-xs text-slate-400 mt-1">พักผ่อนหรือหาอะไรทำเพิ่มเติมได้เลย</div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}