"use client";

import { useState, useTransition, useEffect } from "react";
import { MessageCircle, Send, Trash2, Pencil, Check, X } from "lucide-react";
import { addComment, deleteComment, editComment } from "@/app/actions/comment";

type Comment = {
    id: string;
    body: string;
    createdAt: Date | string;
    updatedAt?: Date | string;
    author: { id: string; name: string };
};

type Props = {
    itemType: string;
    itemId: string;
    projectId: string;
    currentUserId: string;
    initialComments?: Comment[];
};

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(date: Date | string) {
    const d = new Date(date);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
}

function highlightMentions(body: string) {
    const parts = body.split(/(@[\w\u0E00-\u0E7F.-]+)/g);
    return parts.map((part, i) =>
        part.startsWith("@") ? (
            <span key={i} className="font-bold text-emerald-700 dark:text-emerald-400">{part}</span>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

export default function CommentThread({ itemType, itemId, projectId, currentUserId, initialComments = [] }: Props) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [body, setBody] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setComments(initialComments);
    }, [initialComments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) return;
        const text = body.trim();
        setBody("");
        startTransition(async () => {
            const res = await addComment(itemType, itemId, text, projectId);
            if (res && "comment" in res && res.comment) {
                setComments((prev) => [...prev, res.comment as Comment]);
            }
        });
    };

    const handleDelete = (commentId: string) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        startTransition(async () => {
            await deleteComment(commentId, projectId);
        });
    };

    const handleEdit = (commentId: string) => {
        startTransition(async () => {
            const res = await editComment(commentId, editBody, projectId);
            if (res && "comment" in res && res.comment) {
                setComments((prev) => prev.map((c) => (c.id === commentId ? (res.comment as Comment) : c)));
                setEditingId(null);
            }
        });
    };

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MessageCircle size={14} />
                Comments ({comments.length})
            </h4>

            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        ยังไม่มีคอมเมนต์ — พิมพ์ @ชื่อ เพื่อกล่าวถึงเพื่อนร่วมทีม
                    </p>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} className="flex gap-3 group">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 mt-0.5">
                                {getInitials(c.author.name)}
                            </div>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2.5 border border-slate-200/60 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.author.name}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                                        {c.author.id === currentUserId && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingId(c.id); setEditBody(c.body); }}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-emerald-600 transition-all"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(c.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {editingId === c.id ? (
                                    <div className="flex gap-1.5">
                                        <textarea
                                            value={editBody}
                                            onChange={(e) => setEditBody(e.target.value)}
                                            rows={2}
                                            className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <button type="button" onClick={() => handleEdit(c.id)} className="text-emerald-600"><Check size={14} /></button>
                                        <button type="button" onClick={() => setEditingId(null)} className="text-slate-400"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {highlightMentions(c.body)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="เขียน comment... ใช้ @ชื่อ เพื่อกล่าวถึง"
                    rows={2}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 resize-none transition-all"
                />
                <button
                    type="submit"
                    disabled={isPending || !body.trim()}
                    className="p-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl shadow-xs disabled:opacity-50 hover:scale-105 transition-all shrink-0"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
