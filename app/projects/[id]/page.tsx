import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import ProjectDetailView from "@/components/ProjectDetailView";

const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    avatarUrl: true,
} as const;

export default async function ProjectDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string; issueView?: string }>;
}) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const currentTab = resolvedSearchParams.tab || "overview";
    const issueView = resolvedSearchParams.issueView || "table";

    // Single parallel query for project + allUsers + session (zero redundant roundtrips)
    const [project, allUsers, session] = await Promise.all([
        prisma.project.findUnique({
            where: { id },
            include: {
                owner: { select: USER_SELECT },
                developers: { select: USER_SELECT },
                milestones: true,
                requirements: {
                    where: { deletedAt: null },
                    orderBy: { reqCode: 'asc' },
                    include: {
                        uatCases: {
                            where: { deletedAt: null },
                            include: { issues: { where: { deletedAt: null } } }
                        },
                        assignee: { select: USER_SELECT }
                    }
                },
                uatCases: {
                    where: { deletedAt: null },
                    orderBy: { uatCode: 'asc' },
                    include: { assignee: { select: USER_SELECT } }
                },
                issues: {
                    where: { deletedAt: null },
                    orderBy: { issueCode: 'asc' },
                    include: { assignee: { select: USER_SELECT } }
                },
                tasks: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                    include: { assignee: { select: USER_SELECT } }
                },
                activityLogs: {
                    where: { isHidden: false },
                    orderBy: { createdAt: 'desc' },
                    take: 25,
                    include: { user: { select: USER_SELECT } }
                },
            }
        }),
        prisma.user.findMany({
            where: { isActive: true, isApproved: true },
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: 'asc' }
        }),
        getServerSession(authOptions)
    ]);

    if (!project) notFound();

    const currentUser = session?.user;
    const userRole = currentUser?.role || "";
    const isAllowed = currentUser && (
        currentUser.role === "ADMIN" ||
        project.ownerId === currentUser.id ||
        project.developers.some((developer) => developer.id === currentUser.id)
    );
    if (!isAllowed) redirect("/projects");

    return (
        <ProjectDetailView
            project={project}
            allUsers={allUsers}
            userRole={userRole}
            initialTab={currentTab}
            initialIssueView={issueView}
        />
    );
}
