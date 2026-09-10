"use server";

import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function uploadFile(file: File) {
    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop();
    const originalName = file.name;
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `${uniqueId}.${ext}`;
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
        .from('attachments')
        .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true
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
