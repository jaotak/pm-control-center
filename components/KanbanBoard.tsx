"use client";

import { useState, useTransition } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { updateIssueStatus } from "@/app/actions/update";
import PriorityBadge from "./PriorityBadge";
import { AlertCircle } from "lucide-react";

type Issue = {
    id: string;
    issueCode: string;
    title: string;
    severity: string;
    status: string;
    priority: string;
    assignee: { name: string } | null;
};

const COLUMNS = [
    { id: "Open",        label: "Open",        color: "bg-rose-50 border-rose-200",       header: "text-rose-700" },
    { id: "In Progress", label: "In Progress", color: "bg-amber-50 border-amber-200",     header: "text-amber-700" },
    { id: "Testing",     label: "Testing",     color: "bg-teal-50 border-teal-200",   header: "text-teal-700" },
    { id: "Resolved",    label: "Resolved",    color: "bg-emerald-50 border-emerald-200", header: "text-emerald-700" },
    { id: "Closed",      label: "Closed",      color: "bg-slate-50 border-slate-200",     header: "text-slate-500" },
];

const SEVERITY_COLOR: Record<string, string> = {
    High:     "bg-rose-100 text-rose-700",
    Medium:   "bg-amber-100 text-amber-700",
    Low:      "bg-slate-100 text-slate-600",
    Critical: "bg-rose-200 text-rose-900",
};

export default function KanbanBoard({ initialIssues, projectId }: { initialIssues: Issue[]; projectId: string }) {
    const [issues, setIssues] = useState(initialIssues);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    const getColumnIssues = (status: string) => issues.filter(i => i.status === status);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || destination.droppableId === source.droppableId) return;

        const newStatus = destination.droppableId;
        // Capture previous state for rollback
        const previousIssues = issues;
        setError(null);

        // Optimistic update
        setIssues(prev => prev.map(i => i.id === draggableId ? { ...i, status: newStatus } : i));

        startTransition(async () => {
            try {
                await updateIssueStatus(draggableId, newStatus, projectId);
            } catch {
                // Rollback on server error
                setIssues(previousIssues);
                setError(`Failed to move issue to "${newStatus}". Changes reverted.`);
                // Auto-dismiss error after 4s
                setTimeout(() => setError(null), 4000);
            }
        });
    };

    return (
        <div>
            {/* Error toast */}
            {error && (
                <div className="mb-3 flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl animate-in slide-in-from-top-2 duration-200">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
                    {COLUMNS.map(col => {
                        const colIssues = getColumnIssues(col.id);
                        return (
                            <div key={col.id} className={`shrink-0 w-64 border rounded-2xl ${col.color} flex flex-col`}>
                                <div className="px-3.5 py-2.5 border-b border-inherit flex justify-between items-center">
                                    <span className={`text-xs font-extrabold uppercase tracking-wider ${col.header}`}>{col.label}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 ${col.header}`}>
                                        {colIssues.length}
                                    </span>
                                </div>
                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-2.5 space-y-2 min-h-[120px] transition-colors rounded-b-2xl ${snapshot.isDraggingOver ? "bg-white/40" : ""}`}
                                        >
                                            {colIssues.map((issue, index) => (
                                                <Draggable key={issue.id} draggableId={issue.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs transition-all ${snapshot.isDragging ? "shadow-lg rotate-1 scale-105" : "hover:shadow-sm hover:border-emerald-200"}`}
                                                        >
                                                            <div className="flex justify-between items-start gap-1 mb-2">
                                                                <span className="text-[11px] font-extrabold text-emerald-600">{issue.issueCode}</span>
                                                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${SEVERITY_COLOR[issue.severity] || "bg-slate-100 text-slate-600"}`}>
                                                                    {issue.severity}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 mb-2">{issue.title}</p>
                                                            <div className="flex items-center justify-between">
                                                                <PriorityBadge priority={issue.priority} />
                                                                {issue.assignee && (
                                                                    <div
                                                                        className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-[8px] font-extrabold text-white"
                                                                        title={issue.assignee.name}
                                                                    >
                                                                        {issue.assignee.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {colIssues.length === 0 && (
                                                <div className="text-[11px] text-center text-slate-400 italic py-4">
                                                    Drop issues here
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
