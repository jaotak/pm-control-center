"use client";

import { useState, useTransition } from "react";
import { updateProjectStage } from "@/app/actions/project";
import { Activity } from "lucide-react";

const STAGES = [
    "Requirement",
    "Design",
    "Development",
    "UAT",
    "Delivery",
    "Completed"
];

export default function ProjectStageSelect({
    projectId,
    currentStage,
    userRole
}: {
    projectId: string,
    currentStage: string,
    userRole: string
}) {
    const [isPending, startTransition] = useTransition();
    const [localStage, setLocalStage] = useState(currentStage);

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStage = e.target.value;
        const oldStage = localStage;

        setLocalStage(newStage); // เปลี่ยน UI ล่วงหน้าให้ดูไว

        startTransition(async () => {
            const result = await updateProjectStage(projectId, newStage);

            if (result.error) {
                // ถ้าติดเงื่อนไข (เช่น Mandatory ไม่ผ่าน) จะเด้งแจ้งเตือนและเด้งสถานะกลับ
                alert(`❌ ${result.error}`);
                setLocalStage(oldStage);
            }
        });
    };

    // ถ้าเป็น DEV ให้เห็นเป็นแค่ป้ายข้อความธรรมดา (เปลี่ยนไม่ได้)
    if (userRole === "DEV") {
        return (
            <span className="px-4 py-2 bg-gray-100 text-gray-700 font-medium text-sm rounded-lg border border-gray-200 flex items-center gap-2">
                <Activity size={16} className="text-green-500" /> {currentStage}
            </span>
        );
    }

    // ถ้าเป็น PM/Admin ให้เห็นเป็น Dropdown
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Activity size={16} className={isPending ? "text-gray-400 animate-spin" : "text-green-500"} />
            </div>
            <select
                value={localStage}
                onChange={handleChange}
                disabled={isPending}
                className={`appearance-none pl-9 pr-8 py-2 bg-white font-medium text-sm rounded-lg border focus:ring-2 focus:outline-none transition-colors cursor-pointer ${localStage === 'Delivery' || localStage === 'Completed'
                        ? 'border-green-300 text-green-700 bg-green-50 focus:ring-green-500'
                        : 'border-green-300 text-green-700 bg-green-50 focus:ring-green-500'
                    }`}
            >
                {STAGES.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                ))}
            </select>
        </div>
    );
}