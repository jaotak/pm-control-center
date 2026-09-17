"use server";

import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { randomUUID } from "crypto";

const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "png", "jpg", "jpeg", "webp"]);

export async function uploadFile(file: File) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        throw new Error("Unsupported file type");
    }
    const originalName = file.name;
    const fileName = `${user.id}/${randomUUID()}.${ext}`;
    
    // Upload to Supabase
    const { error } = await supabase.storage
        .from('attachments')
        .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
        });

    if (error) {
        console.error("Supabase upload error:", error);
        throw new Error("อัปโหลดไฟล์ล้มเหลว กรุณาตรวจสอบว่าสร้าง Bucket 'attachments' แล้ว");
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

    const url = publicUrlData.publicUrl;

    return {
        name: originalName,
        url: url,
        type: file.type,
        size: file.size,
    };
}

export async function uploadItemAttachment(formData: FormData) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    return uploadFile(file);
}
