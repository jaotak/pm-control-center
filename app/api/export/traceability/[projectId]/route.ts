import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type ExportProject = Prisma.ProjectGetPayload<{
    include: {
        owner: { select: { name: true } },
        developers: { select: { id: true } },
        requirements: {
            include: {
                uatCases: {
                    include: {
                        issues: true
                    }
                }
            }
        }
    }
}>;
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Sanitize a CSV cell to prevent CSV injection attacks.
// Fields that start with =, +, -, @, TAB, or CR are prefixed with a single quote.
function sanitizeCsvCell(value: string): string {
    if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
    return value;
}

function csvRow(...cells: string[]): string {
    return cells.map(c => `"${sanitizeCsvCell(c.replace(/"/g, '""'))}"`).join(',') + '\n';
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    // Auth check
    const user = await getAuthUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId } = await params;

    // Project existence check
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            owner: { select: { name: true } },
            developers: { select: { id: true } },
            requirements: {
                where: { deletedAt: null },
                include: {
                    uatCases: {
                        where: { deletedAt: null },
                        include: {
                            issues: { where: { deletedAt: null } }
                        }
                    }
                }
            }
        }
    });

    if (!project) return new NextResponse("Project not found", { status: 404 });

    // Ownership / membership check — only project owner, assigned devs, or ADMIN can export
    const isOwner = project.ownerId === user.id;
    const isDev = project.developers.some(d => d.id === user.id);
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isDev && !isAdmin) {
        return new NextResponse("Forbidden — you are not a member of this project", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'csv' (default) or 'xlsx'

    if (format === 'xlsx') {
        return buildXlsxResponse(project);
    }

    return buildCsvResponse(project);
}

// ── CSV ─────────────────────────────────────────────────────────────────────

function buildCsvResponse(project: ExportProject) {
    // BOM for Excel Thai charset compatibility
    let csv = '\uFEFF';
    csv += csvRow('Req Code', 'Requirement Title', 'UAT Code', 'UAT Title', 'UAT Status',
        'Issue Code', 'Issue Title', 'Issue Status', 'Severity');

    for (const req of project.requirements) {
        if (req.uatCases.length === 0) {
            csv += csvRow(req.reqCode, req.title, '-', '-', '-', '-', '-', '-', '-');
        } else {
            for (const uat of req.uatCases) {
                if (uat.issues.length === 0) {
                    csv += csvRow(req.reqCode, req.title, uat.uatCode, uat.title, uat.status, '-', '-', '-', '-');
                } else {
                    for (const issue of uat.issues) {
                        csv += csvRow(req.reqCode, req.title, uat.uatCode, uat.title, uat.status,
                            issue.issueCode, issue.title, issue.status, issue.severity);
                    }
                }
            }
        }
    }

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="traceability_${project.code}.csv"`,
        },
    });
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

async function buildXlsxResponse(project: ExportProject) {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PM Control Center';
    const ws = wb.addWorksheet('Traceability Matrix');

    const headerFill = {
        type: 'pattern' as const, pattern: 'solid' as const,
        fgColor: { argb: 'FF4F46E5' }  // emerald-600
    };
    const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };

    ws.columns = [
        { header: 'Req Code',          key: 'reqCode',    width: 14 },
        { header: 'Requirement Title', key: 'reqTitle',   width: 36 },
        { header: 'UAT Code',          key: 'uatCode',    width: 14 },
        { header: 'UAT Title',         key: 'uatTitle',   width: 36 },
        { header: 'UAT Status',        key: 'uatStatus',  width: 16 },
        { header: 'Issue Code',        key: 'issueCode',  width: 14 },
        { header: 'Issue Title',       key: 'issueTitle', width: 36 },
        { header: 'Issue Status',      key: 'issueStatus',width: 16 },
        { header: 'Severity',          key: 'severity',   width: 12 },
    ];

    // Style header row
    ws.getRow(1).eachCell(cell => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const STATUS_COLORS: Record<string, string> = {
        Passed: 'FF10B981', Failed: 'FFF43F5E', Pending: 'FF94A3B8',
        Open: 'FFF43F5E', Resolved: 'FF10B981', Closed: 'FF6B7280',
        'In Progress': 'FFF59E0B', Critical: 'FFBE123C',
        High: 'FFF43F5E', Medium: 'FFF59E0B', Low: 'FF94A3B8',
    };

    for (const req of project.requirements) {
        if (req.uatCases.length === 0) {
            ws.addRow({ reqCode: req.reqCode, reqTitle: req.title, uatCode: '-', uatTitle: '-', uatStatus: '-', issueCode: '-', issueTitle: '-', issueStatus: '-', severity: '-' });
        } else {
            for (const uat of req.uatCases) {
                if (uat.issues.length === 0) {
                    const r = ws.addRow({ reqCode: req.reqCode, reqTitle: req.title, uatCode: uat.uatCode, uatTitle: uat.title, uatStatus: uat.status, issueCode: '-', issueTitle: '-', issueStatus: '-', severity: '-' });
                    applyStatusColor(r, 'uatStatus', uat.status, STATUS_COLORS);
                } else {
                    for (const issue of uat.issues) {
                        const r = ws.addRow({ reqCode: req.reqCode, reqTitle: req.title, uatCode: uat.uatCode, uatTitle: uat.title, uatStatus: uat.status, issueCode: issue.issueCode, issueTitle: issue.title, issueStatus: issue.status, severity: issue.severity });
                        applyStatusColor(r, 'uatStatus', uat.status, STATUS_COLORS);
                        applyStatusColor(r, 'issueStatus', issue.status, STATUS_COLORS);
                        applyStatusColor(r, 'severity', issue.severity, STATUS_COLORS);
                    }
                }
            }
        }
    }

    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="traceability_${project.code}.xlsx"`,
        },
    });
}

function applyStatusColor(row: { getCell: (key: string) => { font?: unknown, fill?: unknown, alignment?: unknown } }, key: string, value: string, colorMap: Record<string, string>) {
    const col = row.getCell(key);
    const color = colorMap[value];
    if (color) {
        col.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        col.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }
    col.alignment = { horizontal: 'center', vertical: 'middle' };
}