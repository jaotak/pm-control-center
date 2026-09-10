"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getAuthUser } from "@/lib/auth";

export async function updateProfile(name: string, email: string, department?: string, phone?: string) {
    try {
        const user = await getAuthUser();
        if (!user) return { error: "Unauthorized" };

        // Check email uniqueness (exclude current user)
        if (email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                name,
                email,
                department: department || null,
                phone: phone || null,
            }
        });
        revalidatePath("/settings");
        return { success: true };
    } catch (err: any) {
        console.error("updateProfile error:", err);
        return { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const authUser = await getAuthUser();
    if (!authUser) throw new Error("Unauthorized");

    // Fetch user with password hash
    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) throw new Error("User not found");

    // Verify current password
    let isCurrentValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
        isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    } else {
        // Legacy plaintext comparison
        isCurrentValid = user.password === currentPassword;
    }

    if (!isCurrentValid) {
        return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
    }

    // Validate new password
    if (newPassword.length < 6) {
        return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" };
    }

    // Hash and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: authUser.id },
        data: { password: hashedPassword }
    });

    return { success: true };
}

import { writeFile } from "fs/promises";
import path from "path";

export async function uploadAvatar(formData: FormData) {
    try {
        const user = await getAuthUser();
        if (!user) return { error: "Unauthorized" };

        const file = formData.get("file") as File;
        if (!file) return { error: "No file uploaded" };

        // Check if it's an image
        if (!file.type.startsWith("image/")) {
            return { error: "File is not an image" };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const fileName = `${user.id}-${uniqueId}.${ext}`;
        
        // Vercel filesystem is read-only. This will fail on Vercel unless using external storage (like Supabase storage or S3).
        const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
        const filePath = path.join(uploadDir, fileName);

        try {
            await writeFile(filePath, buffer);
        } catch (e: any) {
            console.error("Local file write failed:", e);
            return { error: "ระบบไม่รองรับการอัปโหลดไฟล์บน Vercel (Read-only filesystem) กรุณาเชื่อมต่อ Supabase Storage หรือ S3" };
        }

        const avatarUrl = `/uploads/avatars/${fileName}`;

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl }
        });

        revalidatePath("/settings");
        return { avatarUrl };
    } catch (err: any) {
        console.error("uploadAvatar error:", err);
        return { error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" };
    }
}