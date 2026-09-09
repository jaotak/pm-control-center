import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, LayoutDashboard, ListTodo, TestTube,
    AlertCircle, CheckSquare, GitMerge, Download, Plus, ShieldCheck, UserCheck, BarChart3, LayoutList, Trash2
} from "lucide-react";
import TaskCheckbox from "@/components/TaskCheckbox";
import IssueStatusSelect from "@/components/IssueStatusSelect";
import DeleteTaskButton from "@/components/DeleteTaskButton";
import RequirementStatusSelect from "@/components/RequirementStatusSelect";
import UATStatusSelect from "@/components/UATStatusSelect";
import ProjectActionButtons from "@/components/ProjectActionButtons";
import TeamManagement from "@/components/TeamManagement";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DeleteActionButton from "@/components/DeleteActionButton";
import AssigneeSelect from "@/components/AssigneeSelect";
import UATMandatoryToggle from "@/components/UATMandatoryToggle";
import ProjectStageSelect from "@/components/ProjectStageSelect";
import EditItemModal from "@/components/EditItemModal";
import ViewItemModal from "@/components/ViewItemModal";
import ProjectActivityLog from "@/components/ProjectActivityLog";
import PriorityBadge from "@/components/PriorityBadge";
import DueDateBadge from "@/components/DueDateBadge";
import KanbanBoard from "@/components/KanbanBoard";
import TimeTracker from "@/components/TimeTracker";

export default async function ProjectDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string; filterStatus?: string; filterPriority?: string; filterAssignee?: string; filterDue?: string; issueView?: string }>;
}) {
    const { id } = await params;

    const resolvedSearchParams = await searchParams;
    const currentTab = resolvedSearchParams.tab || "overview";
    const filterStatus = resolvedSearchParams.filterStatus || "";
    const filterPriority = resolvedSearchParams.filterPriority || "";
    const filterAssignee = resolvedSearchParams.filterAssignee || "";
    const filterDue = resolvedSearchParams.filterDue || "";
    const issueView = resolvedSearchParams.issueView || "table";

    // Build due date filter
    const buildDueDateFilter = () => {
        const now = new Date();
        if (filterDue === "overdue") return { lt: now };
        if (filterDue === "today") {
            const eod = new Date(now); eod.setHours(23, 59, 59, 999);
            return { lte: eod };
        }
        if (filterDue === "week") {
            const eow = new Date(now); eow.setDate(now.getDate() + 7);
            return { lte: eow };
        }
        if (filterDue === "none") return null;
        return undefined;
    };

    const dueDateFilter = buildDueDateFilter();

    const buildWhere = (extra: any = {}) => {
        const w: any = { projectId: id, ...extra };
        if (filterStatus) w.status = filterStatus;
        if (filterPriority) w.priority = filterPriority;
        if (filterAssignee) w.assigneeId = filterAssignee;
        if (filterDue === "none") w.dueDate = null;
        else if (dueDateFilter !== undefined) w.dueDate = dueDateFilter;
        return w;
    };

    const project = await prisma.project.findUnique({
        where: { id: id },
        include: {
            owner: true,
            developers: true,
            requirements: {
                where: currentTab === "requirements" ? { ...buildWhere(), deletedAt: null } : { projectId: id, deletedAt: null },
                orderBy: { reqCode: 'asc' },
                include: { uatCases: { where: { deletedAt: null }, include: { issues: { where: { deletedAt: null } } } }, assignee: true }
            },
            uatCases: {
                where: currentTab === "uat" ? { ...buildWhere(), deletedAt: null } : { projectId: id, deletedAt: null },
                orderBy: { uatCode: 'asc' },
                include: { assignee: true }
            },
            issues: {
                where: currentTab === "issues" ? { ...buildWhere(), deletedAt: null } : { projectId: id, deletedAt: null },
                orderBy: { issueCode: 'asc' },
                include: { assignee: true }
            },
            tasks: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { assignee: true } },
            activityLogs: { where: { isHidden: false }, orderBy: { createdAt: 'desc' }, include: { user: true } },
            milestones: true,
        }
    });

    if (!project) notFound();

    const tabs = [
        { id: "overview",      name: "Overview",           icon: LayoutDashboard },
        { id: "requirements",  name: "Requirements",       icon: ListTodo },
        { id: "uat",           name: "UAT",                icon: TestTube },
        { id: "issues",        name: "Issues",             icon: AlertCircle },
        { id: "tasks",         name: "Tasks",              icon: CheckSquare },
        { id: "traceability",  name: "Traceability Matrix",icon: GitMerge },
        { id: "reports",       name: "Reports",            icon: BarChart3 },
    ];
    // Trash is a separate page link, not a tab

    const allUsers = await prisma.user.findMany();
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || "";

    const projectTeam: { id: string, name: string }[] = [];
    if (project.owner) projectTeam.push({ id: project.owner.id, name: project.owner.name });
    project.developers.forEach(dev => projectTeam.push({ id: dev.id, name: dev.name }));

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">

            {/* Header Hero Section */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                        <Link
                            href="/projects"
                            className="p-2.5 hover:bg-slate-100/80 rounded-2xl text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/60 mt-0.5"
                        >
                            <ArrowLeft size={19} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{project.name}</h1>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200/60">
                                    {project.code}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-3 flex-wrap">
                                <span>ลูกค้า: <strong className="text-slate-700 font-semibold">{project.customer}</strong></span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    PM ผู้ดูแล: <UserCheck size={14} className="text-emerald-500 ml-0.5" />
                                    <strong className="text-slate-700 font-semibold">{project.owner?.name || "ยังไม่ระบุ PM"}</strong>
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                        <ProjectStageSelect
                            projectId={project.id}
                            currentStage={project.stage}
                            userRole={userRole}
                        />
                        <ProjectActionButtons projectId={project.id} />
                    </div>
                </div>

                {/* Tabs Navigation Bar */}
                <div className="border-b border-slate-200/80 mt-6 pt-2">
                    <nav className="flex space-x-2 md:space-x-4 overflow-x-auto custom-scrollbar pb-0.5 items-center">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;
                            return (
                                <Link
                                    key={tab.id}
                                    href={`/projects/${id}?tab=${tab.id}`}
                                    className={`
                                        whitespace-nowrap flex items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border
                                        ${isActive
                                            ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-transparent shadow-md shadow-emerald-500/20'
                                            : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border-transparent'
                                        }
                                    `}
                                >
                                    <Icon size={16} />
                                    {tab.name}
                                </Link>
                            );
                        })}
                        {/* Trash bin — separate page */}
                        {userRole !== "DEV" && (
                            <Link
                                href={`/projects/${id}/trash`}
                                className="ml-auto whitespace-nowrap flex items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all border bg-transparent text-rose-400 hover:text-rose-700 hover:bg-rose-50/60 border-transparent"
                                title="ถังขยะ (Recycle Bin)"
                            >
                                <Trash2 size={15} /> Trash
                            </Link>
                        )}
                    </nav>
                </div>
            </div>

            {/* Tab Content Display */}
            <div className="mt-6">

                {/* Tab: Overview */}
                {currentTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-base font-bold text-slate-800">ความก้าวหน้าโครงการ (Project Progress)</h2>
                                    <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                                        {project.progress}% Complete
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200/50 p-0.5">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600 h-2.5 rounded-full transition-all duration-500 shadow-2xs"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                            <TeamManagement
                                projectId={project.id}
                                currentOwnerId={project.ownerId}
                                assignedDevs={project.developers}
                                allUsers={allUsers}
                                userRole={userRole}
                            />
                            <ProjectActivityLog logs={project.activityLogs} />
                        </div>
                    </div>
                )}

                {/* Tab: Requirements */}
                {currentTab === "requirements" && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 min-h-[300px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800">Requirements Management</h2>
                                <p className="text-xs text-slate-500 mt-0.5">จัดการความต้องการของระบบทั้งหมดในโครงการนี้</p>
                            </div>
                            {userRole !== "DEV" && (
                                <Link
                                    href={`/projects/${id}/requirements/new`}
                                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={16} /> เพิ่ม Requirement
                                </Link>
                            )}
                        </div>

                        {/* FilterBar placeholder — replace with client component if needed */}
                        <div className="mb-4 flex flex-wrap gap-2">
                            {[filterStatus, filterPriority, filterAssignee, filterDue].some(Boolean) && (
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60">
                                    Filters active — <Link href={`/projects/${id}?tab=requirements`} className="text-rose-600 hover:underline">Clear</Link>
                                </div>
                            )}
                        </div>

                        {project.requirements.length > 0 ? (
                            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider">
                                            <th className="px-5 py-3.5">REQ Code</th>
                                            <th className="px-5 py-3.5">Title</th>
                                            <th className="px-5 py-3.5">Priority</th>
                                            <th className="px-5 py-3.5">Due Date</th>
                                            <th className="px-5 py-3.5">Status</th>
                                            <th className="px-5 py-3.5">Assignee</th>
                                            <th className="px-5 py-3.5 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {project.requirements.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-emerald-600">{req.reqCode}</td>
                                                <td className="px-5 py-3.5 font-semibold text-slate-800">{req.title}</td>
                                                <td className="px-5 py-3.5"><PriorityBadge priority={req.priority} /></td>
                                                <td className="px-5 py-3.5"><DueDateBadge dueDate={req.dueDate} /></td>
                                                <td className="px-5 py-3.5">
                                                    <RequirementStatusSelect reqId={req.id} initialStatus={req.status} />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <AssigneeSelect
                                                        type="req"
                                                        itemId={req.id}
                                                        projectId={project.id}
                                                        currentAssigneeId={req.assigneeId}
                                                        teamMembers={projectTeam}
                                                        disabled={userRole === "DEV"}
                                                    />
                                                </td>
                                                <td className="px-5 py-3.5 text-center flex items-center justify-center gap-1">
                                                    <ViewItemModal
                                                        type="req"
                                                        item={{ code: req.reqCode, title: req.title, detail: req.description, status: req.status, attachmentUrls: req.attachmentUrls }}
                                                    />
                                                    {userRole !== "DEV" && (
                                                        <>
                                                            <EditItemModal type="req" item={{ id: req.id, title: req.title, detail: req.description, priority: req.priority, dueDate: req.dueDate ? req.dueDate.toISOString().split('T')[0] : undefined }} projectId={project.id} />
                                                            <DeleteActionButton id={req.id} projectId={project.id} type="req" />
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200/80 rounded-2xl">
                                <ListTodo size={36} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                                <p className="text-sm font-semibold text-slate-600">ยังไม่มี Requirement ในโครงการนี้</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: UAT */}
                {currentTab === "uat" && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 min-h-[300px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800">UAT (User Acceptance Testing)</h2>
                                <p className="text-xs text-slate-500 mt-0.5">ทดสอบ Test Cases และตรวจรับงานระบบ</p>
                            </div>
                            {userRole !== "DEV" && (
                                <Link
                                    href={`/projects/${id}/uat/new`}
                                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={16} /> เพิ่ม Test Case
                                </Link>
                            )}
                        </div>

                        {project.uatCases.length > 0 ? (
                            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider">
                                            <th className="px-5 py-3.5">UAT Code</th>
                                            <th className="px-5 py-3.5">Title</th>
                                            <th className="px-5 py-3.5 text-center">Mandatory</th>
                                            <th className="px-5 py-3.5">Priority</th>
                                            <th className="px-5 py-3.5">Due Date</th>
                                            <th className="px-5 py-3.5 text-center">Status</th>
                                            <th className="px-5 py-3.5">Assignee</th>
                                            <th className="px-5 py-3.5 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {project.uatCases.map((uat) => (
                                            <tr key={uat.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-teal-600">{uat.uatCode}</td>
                                                <td className="px-5 py-3.5 font-semibold text-slate-800">{uat.title}</td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <UATMandatoryToggle
                                                        uatId={uat.id}
                                                        isMandatory={uat.isMandatory}
                                                        projectId={project.id}
                                                        disabled={userRole === "DEV"}
                                                    />
                                                </td>
                                                <td className="px-5 py-3.5"><PriorityBadge priority={uat.priority} /></td>
                                                <td className="px-5 py-3.5"><DueDateBadge dueDate={uat.dueDate} /></td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <UATStatusSelect uatId={uat.id} initialStatus={uat.status || 'Pending'} />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <AssigneeSelect
                                                        type="uat"
                                                        itemId={uat.id}
                                                        projectId={project.id}
                                                        currentAssigneeId={uat.assigneeId}
                                                        teamMembers={projectTeam}
                                                        disabled={userRole === "DEV"}
                                                    />
                                                </td>
                                                <td className="px-5 py-3.5 text-center flex items-center justify-center gap-1">
                                                    <ViewItemModal
                                                        type="uat"
                                                        item={{
                                                            code: uat.uatCode,
                                                            title: uat.title,
                                                            detail: uat.expectedResult,
                                                            status: uat.status || 'Pending',
                                                            extra: uat.isMandatory ? 'บังคับผ่าน' : '',
                                                            attachmentUrls: uat.attachmentUrls
                                                        }}
                                                    />
                                                    {userRole !== "DEV" && (
                                                        <>
                                                            <EditItemModal type="uat" item={{ id: uat.id, title: uat.title, detail: uat.expectedResult, priority: uat.priority, dueDate: uat.dueDate ? uat.dueDate.toISOString().split('T')[0] : undefined }} projectId={project.id} />
                                                            <DeleteActionButton id={uat.id} projectId={project.id} type="uat" />
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200/80 rounded-2xl">
                                <TestTube size={36} className="mx-auto mb-2 opacity-30 text-teal-500" />
                                <p className="text-sm font-semibold text-slate-600">ยังไม่มี UAT Case ในโครงการนี้</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Issues */}
                {currentTab === "issues" && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 min-h-[300px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800">Issue & Defect Tracking</h2>
                                <p className="text-xs text-slate-500 mt-0.5">ติดตามและแก้ไขบั๊กของระบบ</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* View Toggle */}
                                <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/60">
                                    <Link
                                        href={`/projects/${id}?tab=issues&issueView=table`}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${issueView !== "kanban" ? "bg-white shadow-xs text-slate-800" : "text-slate-500"}`}
                                    >
                                        <LayoutList size={13} /> Table
                                    </Link>
                                    <Link
                                        href={`/projects/${id}?tab=issues&issueView=kanban`}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${issueView === "kanban" ? "bg-white shadow-xs text-slate-800" : "text-slate-500"}`}
                                    >
                                        <LayoutDashboard size={13} /> Kanban
                                    </Link>
                                </div>
                                {userRole !== "DEV" && (
                                    <Link
                                        href={`/projects/${id}/issues/new`}
                                        className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5"
                                    >
                                        <Plus size={16} /> แจ้งปัญหา (Log Issue)
                                    </Link>
                                )}
                            </div>
                        </div>

                        {project.issues.length > 0 ? (
                            issueView === "kanban" ? (
                                <KanbanBoard initialIssues={project.issues as any} projectId={project.id} />
                            ) : (
                                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider">
                                                <th className="px-5 py-3.5">Issue Code</th>
                                                <th className="px-5 py-3.5">Title</th>
                                                <th className="px-5 py-3.5 text-center">Severity</th>
                                                <th className="px-5 py-3.5">Priority</th>
                                                <th className="px-5 py-3.5">Due Date</th>
                                                <th className="px-5 py-3.5 text-center">Status</th>
                                                <th className="px-5 py-3.5">Assignee</th>
                                                <th className="px-5 py-3.5 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {project.issues.map((issue) => (
                                                <tr key={issue.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="px-5 py-3.5 font-bold text-rose-600">{issue.issueCode}</td>
                                                    <td className="px-5 py-3.5 font-semibold text-slate-800">{issue.title}</td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border
                                                            ${issue.severity === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                issue.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    'bg-slate-100 text-slate-700 border-slate-200'}`}
                                                        >
                                                            {issue.severity}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5"><PriorityBadge priority={issue.priority} /></td>
                                                    <td className="px-5 py-3.5"><DueDateBadge dueDate={issue.dueDate} /></td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <IssueStatusSelect issueId={issue.id} initialStatus={issue.status} />
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <AssigneeSelect
                                                            type="issue"
                                                            itemId={issue.id}
                                                            projectId={project.id}
                                                            currentAssigneeId={issue.assigneeId}
                                                            teamMembers={projectTeam}
                                                            disabled={userRole === "DEV"}
                                                        />
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center flex items-center justify-center gap-1">
                                                        <ViewItemModal
                                                            type="issue"
                                                            item={{
                                                                code: issue.issueCode,
                                                                title: issue.title,
                                                                detail: issue.stepsToReproduce,
                                                                status: issue.status,
                                                                extra: `ความรุนแรง: ${issue.severity}`,
                                                                attachmentUrls: issue.attachmentUrls
                                                            }}
                                                        />
                                                        {userRole !== "DEV" && (
                                                            <>
                                                                <EditItemModal type="issue" item={{ id: issue.id, title: issue.title, detail: issue.stepsToReproduce, priority: issue.priority, dueDate: issue.dueDate ? issue.dueDate.toISOString().split('T')[0] : undefined }} projectId={project.id} />
                                                                <DeleteActionButton id={issue.id} projectId={project.id} type="issue" />
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200/80 rounded-2xl">
                                <AlertCircle size={36} className="mx-auto mb-2 opacity-30 text-rose-500" />
                                <p className="text-sm font-semibold text-slate-600">ยังไม่มีการแจ้ง Issue ในโครงการนี้ 🎉</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Traceability Matrix */}
                {currentTab === "traceability" && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 min-h-[300px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                                    <GitMerge size={20} className="text-emerald-600" />
                                    Full Traceability Matrix
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">เชื่อมโยง Requirement ➔ UAT Test Case ➔ Related Issues</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/api/export/traceability/${project.id}`}
                                    download
                                    className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-2xs"
                                >
                                    <Download size={15} />
                                    Export CSV
                                </a>
                                <a
                                    href={`/api/export/traceability/${project.id}?format=xlsx`}
                                    download
                                    className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-2xs"
                                >
                                    <Download size={15} />
                                    Export Excel
                                </a>
                            </div>

                        </div>

                        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-emerald-50/80 text-emerald-900 border-b border-emerald-200/80 text-xs font-extrabold uppercase">
                                        <th className="px-5 py-3.5 w-1/3 border-r border-emerald-200/60">1. Requirement</th>
                                        <th className="px-5 py-3.5 w-1/3 border-r border-emerald-200/60">2. UAT Cases</th>
                                        <th className="px-5 py-3.5 w-1/3">3. Related Issues (Bugs)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/80">
                                    {project.requirements.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/40 align-top">
                                            <td className="px-5 py-4 border-r border-slate-200/80 bg-white">
                                                <div className="font-extrabold text-emerald-600">{req.reqCode}</div>
                                                <div className="text-slate-800 font-semibold mt-1 mb-2 text-xs">{req.title}</div>
                                                <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-slate-700">
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td colSpan={2} className="p-0">
                                                {req.uatCases.length > 0 ? (
                                                    <div className="flex flex-col h-full w-full">
                                                        {req.uatCases.map((uat, index) => (
                                                            <div key={uat.id} className={`flex w-full ${index !== 0 ? 'border-t border-slate-200/80' : ''}`}>
                                                                <div className="w-1/2 px-4 py-4 border-r border-slate-200/80 hover:bg-slate-50 transition-colors">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-bold text-teal-600 text-xs">{uat.uatCode}</span>
                                                                        {uat.status === 'Passed' && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs"></span>}
                                                                        {uat.status === 'Failed' && <span className="w-2 h-2 rounded-full bg-rose-500 shadow-2xs"></span>}
                                                                    </div>
                                                                    <div className="text-slate-700 text-xs font-medium leading-relaxed">{uat.title}</div>
                                                                </div>
                                                                <div className="w-1/2 px-4 py-4 bg-slate-50/30">
                                                                    {uat.issues.length > 0 ? (
                                                                        <div className="space-y-2">
                                                                            {uat.issues.map(issue => (
                                                                                <div key={issue.id} className="p-2.5 border border-rose-200/80 bg-white rounded-xl flex flex-col gap-1 shadow-2xs hover:shadow-xs transition-all">
                                                                                    <div className="flex justify-between items-start">
                                                                                        <span className="text-xs font-bold text-rose-600">{issue.issueCode}</span>
                                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${issue.status === 'Resolved' || issue.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                                            {issue.status}
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="text-xs text-slate-700 font-medium line-clamp-2" title={issue.title}>{issue.title}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                                                                            -- ไม่พบบั๊ก --
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-8 text-xs text-slate-400 italic text-center w-full">
                                                        ยังไม่มี UAT Case ผูกกับ Requirement นี้
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab: Tasks */}
                {currentTab === "tasks" && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 min-h-[300px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800">รายการงาน (Tasks)</h2>
                                <p className="text-xs text-slate-500 mt-0.5">ติดตามการดำเนินงานรายวันภายในโครงการ</p>
                            </div>
                            {userRole !== "DEV" && (
                                <Link
                                    href={`/projects/${id}/tasks/new`}
                                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={16} /> เพิ่ม Task
                                </Link>
                            )}
                        </div>

                        {project.tasks.length > 0 ? (
                            <div className="space-y-2.5">
                                {project.tasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition-all">
                                        <TaskCheckbox
                                            taskId={task.id}
                                            initialCompleted={task.isCompleted}
                                            title={task.title}
                                        />
                                        <div className="flex items-center gap-3">
                                            <TimeTracker
                                                taskId={task.id}
                                                taskTitle={task.title}
                                                estimatedHours={task.estimatedHours}
                                                loggedHours={task.loggedHours}
                                            />
                                            <AssigneeSelect
                                                type="task"
                                                itemId={task.id}
                                                projectId={project.id}
                                                currentAssigneeId={task.assigneeId}
                                                teamMembers={projectTeam}
                                                disabled={userRole === "DEV"}
                                            />
                                            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                {task.dueDate ? `ครบกำหนด: ${new Date(task.dueDate).toLocaleDateString('th-TH')}` : 'ไม่มีกำหนด'}
                                            </div>
                                            {userRole !== "DEV" && (
                                                <DeleteTaskButton taskId={task.id} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200/80 rounded-2xl">
                                <CheckSquare size={36} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                                <p className="text-sm font-semibold text-slate-600">ยังไม่มีรายการงานในโครงการนี้</p>
                            </div>
                        )}
                    </div>
                )}
                {/* Tab: Reports — redirect to dedicated reports page */}
                {currentTab === "reports" && (
                    <div className="flex items-center justify-center py-16">
                        <Link
                            href={`/projects/${id}/reports`}
                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md shadow-emerald-500/20 hover:scale-105 transition-all"
                        >
                            <BarChart3 size={18} /> Open Full Reports Page
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}