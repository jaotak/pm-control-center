import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FolderKanban, ArrowRight, UserCheck, Users, Shield } from "lucide-react";
import SearchProject from "@/components/SearchProject";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ProjectList({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const resolvedParams = await searchParams;
    const searchQuery = resolvedParams.q ? resolvedParams.q.trim() : "";

    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    let roleWhereCondition: any = {};
    if (role === "PM") {
        roleWhereCondition = { ownerId: userId };
    } else if (role === "DEV") {
        roleWhereCondition = { developers: { some: { id: userId } } };
    }

    const whereCondition: any = {
        ...roleWhereCondition,
    };

    if (searchQuery) {
        whereCondition.OR = [
            { code: { contains: searchQuery, mode: 'insensitive' } },
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { customer: { contains: searchQuery, mode: 'insensitive' } },
        ];
    }

    const projects = await prisma.project.findMany({
        where: whereCondition,
        select: {
            id: true,
            code: true,
            name: true,
            customer: true,
            stage: true,
            progress: true,
            owner: { select: { id: true, name: true } },
            _count: { select: { developers: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    const getStageStyle = (stage: string) => {
        if (stage === 'DONE' || stage === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
        if (stage === 'UAT') return 'bg-teal-50 text-teal-700 border-teal-200/80';
        if (stage === 'DEVELOPMENT') return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <FolderKanban className="text-emerald-600" size={26} />
                        Projects Directory
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>สิทธิ์การใช้งานปัจจุบัน:</span>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <Shield size={12} /> {role}
                        </span>
                    </p>
                </div>

                {role !== "DEV" && (
                    <Link
                        href="/projects/new"
                        prefetch={true}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
                    >
                        <Plus size={17} />
                        สร้างโครงการใหม่
                    </Link>
                )}
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                <SearchProject />
                <div className="text-xs font-bold text-slate-500 hidden sm:block">
                    พบทั้งหมด <strong className="text-emerald-600 font-extrabold text-sm">{projects.length}</strong> โครงการ
                </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Project Code</th>
                                <th className="px-6 py-4">Project Name & Customer</th>
                                <th className="px-6 py-4">PM ผู้ดูแล</th>
                                <th className="px-6 py-4">ทีม Developer</th>
                                <th className="px-6 py-4">Stage</th>
                                <th className="px-6 py-4 min-w-[140px]">Progress</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.map((prj) => (
                                <tr key={prj.id} className="hover:bg-emerald-50/30 transition-colors duration-150 group">
                                    <td className="px-6 py-4 font-bold text-emerald-600">
                                        <Link href={`/projects/${prj.id}`} prefetch={true} className="hover:underline flex items-center gap-1.5">
                                            {prj.code}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{prj.name}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{prj.customer}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {prj.owner ? (
                                            <span className="flex items-center gap-1.5 font-medium text-xs text-slate-700">
                                                <UserCheck size={14} className="text-emerald-500" />
                                                {prj.owner.name}
                                            </span>
                                        ) : (
                                            <span className="text-amber-600 font-semibold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                ยังไม่กำหนด PM
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <Users size={14} className="text-slate-400 mr-1" />
                                            <span className="text-xs font-semibold text-slate-600">
                                                {prj._count.developers} คน
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStageStyle(prj.stage)}`}>
                                            {prj.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-slate-100 rounded-full h-2 min-w-[70px] overflow-hidden border border-slate-200/50">
                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-300"
                                                    style={{ width: `${prj.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600 min-w-[32px]">{prj.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/projects/${prj.id}`}
                                            prefetch={true}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors duration-150"
                                        >
                                            เข้าชม <ArrowRight size={13} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                            {projects.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                                            <FolderKanban size={32} />
                                        </div>
                                        <p className="text-base font-bold text-slate-700">ไม่พบโปรเจกต์ที่คุณมีสิทธิ์เข้าถึง</p>
                                        <span className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหา หรือติดต่อ Admin เพื่อขอสิทธิ์</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}