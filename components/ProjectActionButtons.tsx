"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import DeleteProjectButton from "./DeleteProjectButton";
import { useSession } from "next-auth/react";

export default function ProjectActionButtons({ projectId }: { projectId: string }) {
    const { data: session } = useSession(); const role = (session?.user as any)?.role;

    // ถ้าเป็น DEV ให้ซ่อนปุ่มทั้งหมดไปเลย (ไม่คืนค่าอะไรกลับไป)
    if (role === "DEV") return null;

    return (
        <div className="flex items-center gap-3">
            <Link
                href={`/projects/${projectId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
                <Edit size={16} />
                แก้ไข
            </Link>

            {/* ถ้าเป็น PM สร้าง/แก้ไขได้ แต่ลบไม่ได้ จะเห็นแค่ปุ่มแก้ไข (ซ่อนปุ่มลบ) */}
            {role === "ADMIN" && (
                <DeleteProjectButton projectId={projectId} />
            )}
        </div>
    );
}