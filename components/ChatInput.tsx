"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, X, File, Image as ImageIcon } from "lucide-react";
import { uploadItemAttachment } from "@/app/actions/upload";

interface ChatInputProps {
    roomId?: string;
    onSend: (message: string, attachment?: { url: string; name: string; type: string; size: number }) => Promise<boolean | void>;
    disabled?: boolean;
    placeholder?: string;
}

const QUICK_EMOJIS = ["👍", "❤️", "😊", "🎉", "🔥", "🙏", "🚀", "✅"];

export default function ChatInput({
    roomId,
    onSend,
    disabled = false,
    placeholder = "พิมพ์ข้อความ... (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
}: ChatInputProps) {
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus textarea on desktop mount or when switching rooms
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
            textareaRef.current?.focus();
        }
    }, [roomId]);

    // Auto-resize textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
        }
    }, [text]);

    const handleSend = async () => {
        const trimmed = text.trim();
        if ((!trimmed && !selectedFile) || isSending || disabled) return;

        setIsSending(true);

        // Clear input immediately so user can start typing their next message right away
        setText("");
        setSelectedFile(null);
        setShowEmojiPicker(false);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.focus();
        }

        try {
            let attachmentData = undefined;

            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                const res = await uploadItemAttachment(formData);
                attachmentData = res as any;
            }

            await onSend(trimmed, attachmentData);
        } catch (error) {
            console.error("Upload or send failed:", error);
            alert("ไม่สามารถส่งไฟล์ได้ ขนาดไฟล์ต้องไม่เกิน 10MB");
        } finally {
            setIsSending(false);
            // Retain focus in all scenarios
            textareaRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const addEmoji = (emoji: string) => {
        setText((prev) => prev + emoji);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                alert("ขนาดไฟล์ต้องไม่เกิน 10MB");
                return;
            }
            setSelectedFile(file);
            setTimeout(() => textareaRef.current?.focus(), 0);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        textareaRef.current?.focus();
    };

    return (
        <div className="relative border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-3 sm:p-4">
            {/* Quick Emoji Bar */}
            {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xl rounded-2xl p-2 flex items-center gap-1.5 z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {QUICK_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => addEmoji(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-transform hover:scale-125 active:scale-95"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* File Staging Area */}
            {selectedFile && (
                <div className="mb-3 flex items-center gap-3 p-3 bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0">
                        {selectedFile.type.startsWith("image/") ? (
                            <ImageIcon size={20} className="text-emerald-500" />
                        ) : (
                            <File size={20} className="text-slate-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={removeFile}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all shadow-2xs">
                
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                />

                {/* Attach File Button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors shrink-0 mb-0.5"
                    title="แนบไฟล์"
                >
                    <Paperclip size={20} />
                </button>

                {/* Emoji Toggle Button */}
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors shrink-0 mb-0.5"
                    title="แทรกอิโมจิ"
                >
                    <Smile size={20} />
                </button>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={selectedFile ? "พิมพ์ข้อความอธิบายไฟล์... (Enter เพื่อส่ง)" : placeholder}
                    className="flex-1 max-h-[140px] py-2 px-2 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                />

                {/* Send Button */}
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={(!text.trim() && !selectedFile) || isSending || disabled}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-medium shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:scale-105 active:scale-95 transition-all shrink-0 mb-0.5"
                    title="ส่งข้อความ"
                >
                    {isSending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send size={16} className="translate-x-0.5" />
                    )}
                </button>
            </div>
        </div>
    );
}
