"use client";

import { useState, useTransition, useEffect } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { addComment, deleteComment } from "@/app/actions/comment";

type Comment = {
    id: string;
    body: string;
    createdAt: Date | string;
    author: { id: string; name: string };
};

type Props = {
    itemType: string;
    itemId: string;
    projectId: string;
    currentUserId: string;
    initialComments: Comment[];
};

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(date: Date | string) {
    const d = new Date(date);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
}

export default function CommentThread({ itemType, itemId, projectId, currentUserId, initialComments }: Props) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [body, setBody] = useState("");
    const [isPending, startTransition] = useTransition();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setComments(initialComments); }, [initialComments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) return;
        startTransition(async () => {
            await addComment(itemType, itemId, body.trim(), projectId);
            setBody("");
        });
    };

    const handleDelete = (commentId: string) => {
        startTransition(async () => {
            await deleteComment(commentId, projectId);
        });
    };

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MessageCircle size={14} />
                Comments ({comments.length})
            </h4>

            {/* Comment List */}
            <div className="space-y-3">
                {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-xl">
                        No comments yet — be the first!
                    </p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="flex gap-3 group">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 mt-0.5">
                                {getInitials(c.author.name)}
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-200/60">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-700">{c.author.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                                        {c.author.id === currentUserId && (
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Compose Box */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="เขียน comment..."
                    rows={2}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800 resize-none transition-all"
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
