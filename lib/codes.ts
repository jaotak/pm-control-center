import { prisma } from "@/lib/prisma";

export type CodePrefix = "REQ" | "UAT" | "ISSUE";

function tableFor(prefix: CodePrefix) {
    if (prefix === "REQ") return { table: `"Requirement"`, column: `"reqCode"` };
    if (prefix === "UAT") return { table: `"UATCase"`, column: `"uatCode"` };
    return { table: `"Issue"`, column: `"issueCode"` };
}

export async function generateNextCode(projectId: string, prefix: CodePrefix): Promise<string> {
    const { table, column } = tableFor(prefix);
    const pattern = `^${prefix}-[0-9]+$`;
    const rows = await prisma.$queryRawUnsafe<{ n: number | null }[]>(
        `SELECT MAX(CAST(SUBSTRING(${column} FROM ${prefix.length + 2}) AS INTEGER)) AS n
         FROM ${table}
         WHERE "projectId" = $1 AND ${column} ~ $2`,
        projectId,
        pattern
    );
    const next = (rows[0]?.n ?? 0) + 1;
    return `${prefix}-${String(next).padStart(3, "0")}`;
}
