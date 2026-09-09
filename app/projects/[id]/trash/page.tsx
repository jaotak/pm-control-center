import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import TrashActions from "@/components/TrashActions";

export default async function TrashPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || "";

    if (userRole === "DEV") {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <AlertTriangle size={48} className="mx-auto mb-4 text-amber-400 opacity-60" />
                <p className="text-slate-600 font-semibold">ไม่มีสิทธิ์เข้าถึงถังขยะ</p>
            </div>
        );
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) notFound();

    const [deletedReqs, deletedUATs, deletedIssues, deletedTasks] = await Promise.all([
        prisma.requirement.findMany({ where: { projectId: id, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } }),
        prisma.uATCase.findMany({ where: { projectId: id, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } }),
        prisma.issue.findMany({ where: { projectId: id, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } }),
        prisma.task.findMany({ where: { projectId: id, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } }),
    ]);

    const totalItems = deletedReqs.length + deletedUATs.length + deletedIssues.length + deletedTasks.length;

    const sections = [
        { label: "Requirements", type: "req" as const, items: deletedReqs.map(r => ({ id: r.id, code: r.reqCode, title: r.title, deletedAt: r.deletedAt! })), color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        { label: "UAT Cases",    type: "uat" as const, items: deletedUATs.map(u => ({ id: u.id, code: u.uatCode, title: u.title, deletedAt: u.deletedAt! })), color: "text-teal-600 bg-teal-50 border-teal-200" },
        { label: "Issues",       type: "issue" as const, items: deletedIssues.map(i => ({ id: i.id, code: i.issueCode, title: i.title, deletedAt: i.deletedAt! })), color: "text-rose-600 bg-rose-50 border-rose-200" },
        { label: "Tasks",        type: "task" as const, items: deletedTasks.map(t => ({ id: t.id, code: "TASK", title: t.title, deletedAt: t.deletedAt! })), color: "text-amber-600 bg-amber-50 border-amber-200" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 flex items-center gap-4">
                <Link href={`/projects/${id}`} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 border border-slate-200/60">
                    <ArrowLeft size={18} />
                </Link>
                <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                    <Trash2 size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-extrabold text-slate-800">ถังขยะ (Recycle Bin)</h1>
                    <p className="text-xs text-slate-500 mt-0.5">{project.name} · {project.code} · {totalItems} รายการที่ถูกลบ</p>
                </div>
            </div>

            {totalItems === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-20 text-center">
                    <Trash2 size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-semibold text-sm">ถังขยะว่างเปล่า</p>
                    <p className="text-slate-400 text-xs mt-1">ไม่มีรายการที่ถูกลบ</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sections.map(section => section.items.length > 0 && (
                        <div key={section.label} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${section.color}`}>
                                    {section.label}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">{section.items.length} รายการ</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {section.items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-extrabold ${section.color.split(' ')[0]}`}>{item.code}</span>
                                                <span className="text-sm font-semibold text-slate-700 truncate">{item.title}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Trash2 size={10} /> ลบเมื่อ {new Date(item.deletedAt).toLocaleString("th-TH")}
                                            </p>
                                        </div>
                                        <TrashActions itemId={item.id} type={section.type} projectId={id} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
