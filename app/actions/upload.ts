"use server";

import { writeFile } from "fs/promises";
import path from "path";
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
    const uploadDir = path.join(process.cwd(), "public", "uploads", "attachments");
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const url = `/uploads/attachments/${fileName}`;

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
