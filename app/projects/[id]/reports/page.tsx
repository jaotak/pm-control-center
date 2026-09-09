import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, Clock } from "lucide-react";
import UATPassRateDonut from "@/components/UATPassRateDonut";
import IssueSeverityChart from "@/components/IssueSeverityChart";
import BurndownChart from "@/components/BurndownChart";

export default async function ProjectReportsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            uatCases:     { where: { deletedAt: null } },
            issues:       { where: { deletedAt: null } },
            tasks:        { where: { deletedAt: null } },
            activityLogs: { where: { isHidden: false }, orderBy: { createdAt: "asc" }, include: { user: true } }
        }
    });

    if (!project) notFound();

    // UAT pass rate
    const uatStats = {
        Passed:      project.uatCases.filter(u => u.status === "Passed").length,
        Failed:      project.uatCases.filter(u => u.status === "Failed").length,
        Pending:     project.uatCases.filter(u => u.status === "Pending").length,
        "In Progress": project.uatCases.filter(u => u.status === "In Progress").length,
    };

    // Issue severity breakdown
    const severityStats = {
        Critical: project.issues.filter(i => i.severity === "Critical").length,
        High:     project.issues.filter(i => i.severity === "High").length,
        Medium:   project.issues.filter(i => i.severity === "Medium").length,
        Low:      project.issues.filter(i => i.severity === "Low").length,
    };

    // Issue status breakdown
    const issueStatusStats = {
        Open:          project.issues.filter(i => i.status === "Open").length,
        "In Progress": project.issues.filter(i => i.status === "In Progress").length,
        Testing:       project.issues.filter(i => i.status === "Testing").length,
        Resolved:      project.issues.filter(i => i.status === "Resolved").length,
        Closed:        project.issues.filter(i => i.status === "Closed").length,
    };

    // Summary stats
    const totalTasks      = project.tasks.length;
    const completedTasks  = project.tasks.filter(t => t.isCompleted).length;
    const openIssues      = project.issues.filter(i => !["Resolved", "Closed"].includes(i.status)).length;
    const passRate        = project.uatCases.length > 0
        ? Math.round((uatStats.Passed / project.uatCases.length) * 100) : 0;

    // Time tracking summary
    const totalEstimated  = project.tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
    const totalLogged     = project.tasks.reduce((s, t) => s + (t.loggedHours ?? 0), 0);

    // Build burndown data: cumulative logged hours grouped by day from activityLogs
    const timeLogPattern = /บันทึกเวลา (\d+(?:\.\d+)?)h/;
    const cumulativeByDay: Record<string, number> = {};
    let running = 0;
    for (const log of project.activityLogs) {
        const match = log.action.match(timeLogPattern);
        if (!match) continue;
        const hours = parseFloat(match[1]);
        const day = new Date(log.createdAt).toLocaleDateString("th-TH", { month: "short", day: "numeric" });
        running += hours;
        cumulativeByDay[day] = running;
    }
    const burndownData = Object.entries(cumulativeByDay).map(([date, logged]) => ({
        date, logged, estimated: totalEstimated
    }));

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-8 flex items-center gap-4">
                <Link href={`/projects/${id}`} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 border border-slate-200/60">
                    <ArrowLeft size={18} />
                </Link>
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/80">
                    <BarChart3 size={26} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Project Reports</h1>
                    <p className="text-xs text-slate-500 mt-1">{project.name} · {project.code} · สรุปภาพรวมและสถิติโครงการ</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Progress",      value: `${project.progress}%`, sub: "Overall completion",                    color: "text-emerald-600",  bg: "bg-emerald-50" },
                    { label: "Tasks Done",    value: `${completedTasks}/${totalTasks}`, sub: "Tasks completed",            color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Open Issues",   value: openIssues, sub: "Unresolved issues",                                  color: "text-rose-600",    bg: "bg-rose-50" },
                    { label: "UAT Pass Rate", value: `${passRate}%`, sub: `${uatStats.Passed} / ${project.uatCases.length} passed`, color: "text-teal-600", bg: "bg-teal-50" },
                ].map(c => (
                    <div key={c.label} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5">
                        <div className={`text-3xl font-extrabold ${c.color} mb-1`}>{c.value}</div>
                        <div className="text-sm font-bold text-slate-700">{c.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* UAT Pass Rate Donut */}
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
                    <h2 className="text-base font-extrabold text-slate-800 mb-4">UAT Test Case Results</h2>
                    <UATPassRateDonut
                        data={[
                            { name: "Passed",      value: uatStats.Passed,           color: "#10b981" },
                            { name: "Failed",      value: uatStats.Failed,           color: "#f43f5e" },
                            { name: "Pending",     value: uatStats.Pending,          color: "#94a3b8" },
                            { name: "In Progress", value: uatStats["In Progress"],   color: "#8b5cf6" },
                        ]}
                    />
                </div>

                {/* Issue Severity Breakdown */}
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
                    <h2 className="text-base font-extrabold text-slate-800 mb-4">Issue Severity Breakdown</h2>
                    <IssueSeverityChart
                        data={[
                            { name: "Critical", value: severityStats.Critical, color: "#be123c" },
                            { name: "High",     value: severityStats.High,     color: "#f43f5e" },
                            { name: "Medium",   value: severityStats.Medium,   color: "#f59e0b" },
                            { name: "Low",      value: severityStats.Low,      color: "#94a3b8" },
                        ]}
                    />
                </div>
            </div>

            {/* Burn-down / Time Tracking Summary */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <Clock size={18} className="text-emerald-500" /> Time Tracking — Burn-down
                    </h2>
                    <div className="flex gap-4 text-xs font-bold">
                        <span className="text-slate-500">Estimated: <span className="text-amber-600">{totalEstimated.toFixed(1)}h</span></span>
                        <span className="text-slate-500">Logged: <span className={totalLogged > totalEstimated ? "text-rose-600" : "text-emerald-600"}>{totalLogged.toFixed(1)}h</span></span>
                        <span className="text-slate-500">Remaining: <span className="text-emerald-600">{Math.max(0, totalEstimated - totalLogged).toFixed(1)}h</span></span>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">ชั่วโมงสะสมที่บันทึกแล้ว เทียบกับงบประมาณเวลาทั้งหมด</p>
                <BurndownChart data={burndownData} totalEstimated={totalEstimated} />
            </div>

            {/* Issue Status Breakdown Table */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
                <h2 className="text-base font-extrabold text-slate-800 mb-4">Issue Status Breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(issueStatusStats).map(([status, count]) => (
                        <div key={status} className="text-center bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                            <div className="text-2xl font-extrabold text-slate-800">{count}</div>
                            <div className="text-xs font-bold text-slate-500 mt-1">{status}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Log Summary */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
                <h2 className="text-base font-extrabold text-slate-800 mb-4">Recent Activity ({project.activityLogs.length} total)</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {project.activityLogs.slice(-15).reverse().map(log => (
                        <div key={log.id} className="flex items-start gap-3 text-xs py-2 border-b border-slate-100 last:border-0">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-[9px] font-extrabold text-white shrink-0 mt-0.5">
                                {log.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <span className="font-bold text-slate-700">{log.user.name}</span>
                                <span className="text-slate-500"> — {log.action}</span>
                                <div className="text-slate-400 text-[10px] mt-0.5">
                                    {new Date(log.createdAt).toLocaleString("th-TH")}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
