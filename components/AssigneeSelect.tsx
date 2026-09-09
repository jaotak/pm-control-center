"use client";

import { useTransition } from "react";
import { updateItemAssignee } from "@/app/actions/assign";
import { User } from "lucide-react";

type TeamMember = { id: string; name: string };

export default function AssigneeSelect({
    type, itemId, projectId, currentAssigneeId, teamMembers, disabled
}: {
    type: 'req' | 'uat' | 'issue' | 'task',
    itemId: string,
    projectId: string,
    currentAssigneeId: string | null,
    teamMembers: TeamMember[],
    disabled: boolean
}) {
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        startTransition(() => {
            updateItemAssignee(type, itemId, e.target.value, projectId);
        });
    };

    return (
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 w-full max-w-[140px]">
            <User size={14} className="text-gray-400 shrink-0" />
            <select
                value={currentAssigneeId || ""}
                onChange={handleChange}
                disabled={disabled || isPending}
                className="bg-transparent text-xs text-gray-700 outline-none w-full cursor-pointer appearance-none truncate disabled:opacity-50"
            >
                <option value="">-- ไม่ระบุ --</option>
                {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                ))}
            </select>
        </div>
    );
}