import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";
import { Shield, Briefcase, Phone, Mail, FolderKanban, CheckSquare, AlertCircle } from "lucide-react";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return <div className="p-8 text-center text-slate-500 font-semibold">กรุณาเข้าสู่ระบบ</div>;

    const { id } = await params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    projectsOwned: true,
                    projectsAssigned: true,
                    assignedTasks: true,
                    assignedIssues: true,
                    assignedReqs: true,
                }
            },
            projectsOwned: {
                select: { id: true, name: true, code: true, stage: true, progress: true }
            },
            projectsAssigned: {
                select: { id: true, name: true, code: true, stage: true, progress: true }
            }
        }
    });

    if (!user) return notFound();

    // Combine and deduplicate projects (User might own and be assigned to the same project, though usually not)
    const allProjectsMap = new Map();
    user.projectsOwned.forEach(p => allProjectsMap.set(p.id, { ...p, role: 'Owner' }));
    user.projectsAssigned.forEach(p => {
        if (!allProjectsMap.has(p.id)) {
            allProjectsMap.set(p.id, { ...p, role: 'Developer' });
        }
    });
    const allProjects = Array.from(allProjectsMap.values());

    const roleColors: Record<string, string> = {
        ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
        PM: "bg-indigo-100 text-indigo-700 border-indigo-200",
        DEV: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header / Profile Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-48 h-48 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                {/* Avatar */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-4xl font-extrabold shrink-0 shadow-lg shadow-emerald-500/30 overflow-hidden ring-4 ring-white relative z-10">
                    {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover bg-white" />
                    ) : (
                        user.name.charAt(0).toUpperCase()
                    )}
                </div>

                <div className="flex-1 text-center md:text-left relative z-10 pt-2">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{user.name}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-3 flex-wrap">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roleColors[user.role] || "bg-slate-100 text-slate-700 border-slate-200"} flex items-center gap-1.5`}>
                            <Shield size={14} /> {user.role}
                        </span>
                        {user.department && (
                            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1.5">
                                <Briefcase size={14} /> {user.department}
                            </span>
                        )}
                        {!user.isActive && (
                            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">
                                Inactive
                            </span>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-6 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Mail size={16} className="text-emerald-500" />
                            {user.email}
                        </div>
                        {user.phone && (
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <Phone size={16} className="text-emerald-500" />
                                {user.phone}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FolderKanban size={18} /></div>
                        <div className="text-xs font-bold text-slate-500">Total Projects</div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-800">{allProjects.length}</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckSquare size={18} /></div>
                        <div className="text-xs font-bold text-slate-500">Assigned Tasks</div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-800">{user._count.assignedTasks}</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle size={18} /></div>
                        <div className="text-xs font-bold text-slate-500">Assigned Issues</div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-800">{user._count.assignedIssues}</div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><Shield size={18} /></div>
                        <div className="text-xs font-bold text-slate-500">Assigned Reqs</div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-800">{user._count.assignedReqs}</div>
                </div>
            </div>

            {/* Projects List */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-8">
                <h2 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <FolderKanban className="text-emerald-500" /> Active Projects
                </h2>
                {allProjects.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FolderKanban size={28} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">No active projects</p>
                        <p className="text-xs text-slate-400 mt-1">This user is not assigned to any projects currently.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allProjects.map((project) => (
                            <Link 
                                href={`/projects/${project.id}`} 
                                key={project.id}
                                className="group flex flex-col p-5 border border-slate-200/80 rounded-2xl hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/10 transition-all bg-slate-50/50 hover:bg-white"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                                            {project.code}
                                        </div>
                                        <div className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700">
                                            {project.role}
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400">{project.stage}</div>
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1">{project.name}</h3>
                                <div className="mt-4 flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">{project.progress}%</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
