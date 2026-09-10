import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    // ถ้าพิมพ์น้อยกว่า 2 ตัวอักษร จะไม่ค้นหาเพื่อประหยัดทรัพยากร
    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    // ใช้ Promise.all เพื่อดึงข้อมูล 5 ตารางพร้อมกัน (ทำให้ค้นหาได้เร็วมาก)
    const [projects, reqs, uats, issues, tasks] = await Promise.all([
        prisma.project.findMany({
            where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }] },
            select: { id: true, name: true, code: true },
            take: 5
        }),
        prisma.requirement.findMany({
            where: { deletedAt: null, OR: [{ title: { contains: q, mode: 'insensitive' } }, { reqCode: { contains: q, mode: 'insensitive' } }] },
            select: { id: true, title: true, reqCode: true, projectId: true },
            take: 5
        }),
        prisma.uATCase.findMany({
            where: { deletedAt: null, OR: [{ title: { contains: q, mode: 'insensitive' } }, { uatCode: { contains: q, mode: 'insensitive' } }] },
            select: { id: true, title: true, uatCode: true, projectId: true },
            take: 5
        }),
        prisma.issue.findMany({
            where: { deletedAt: null, OR: [{ title: { contains: q, mode: 'insensitive' } }, { issueCode: { contains: q, mode: 'insensitive' } }] },
            select: { id: true, title: true, issueCode: true, projectId: true },
            take: 5
        }),
        prisma.task.findMany({
            where: { deletedAt: null, title: { contains: q, mode: 'insensitive' } },
            select: { id: true, title: true, projectId: true },
            take: 5
        }),
    ]);

    // นำข้อมูลทั้งหมดมาจัดรูปฟอร์แมตเดียวกันเพื่อให้หน้าบ้านแสดงผลได้ง่าย
    const results = [
        ...projects.map(p => ({ id: p.id, title: p.name, code: p.code, type: 'Project', icon: 'Folder', link: `/projects/${p.id}` })),
        ...reqs.map(r => ({ id: r.id, title: r.title, code: r.reqCode, type: 'Requirement', icon: 'ListTodo', link: `/projects/${r.projectId}?tab=requirements` })),
        ...uats.map(u => ({ id: u.id, title: u.title, code: u.uatCode, type: 'UAT', icon: 'TestTube', link: `/projects/${u.projectId}?tab=uat` })),
        ...issues.map(i => ({ id: i.id, title: i.title, code: i.issueCode, type: 'Issue', icon: 'AlertCircle', link: `/projects/${i.projectId}?tab=issues` })),
        ...tasks.map(t => ({ id: t.id, title: t.title, code: 'TASK', type: 'Task', icon: 'CheckSquare', link: t.projectId ? `/projects/${t.projectId}?tab=tasks` : '/tasks' }))
    ];

    return NextResponse.json({ results });
}