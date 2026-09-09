"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { togglePinProject } from "@/app/actions/pin";

export default function PinButton({ projectId, isPinned }: { projectId: string; isPinned: boolean }) {
    const [pinned, setPinned] = useState(isPinned);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        setPinned(prev => !prev); // Optimistic
        startTransition(async () => {
            await togglePinProject(projectId);
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            title={pinned ? "Unpin project" : "Pin project"}
            className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                pinned
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-slate-300 hover:text-amber-400"
            }`}
        >
            <Star size={16} fill={pinned ? "currentColor" : "none"} />
        </button>
    );
}
