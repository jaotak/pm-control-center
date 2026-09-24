"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type RegisterInput = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    department?: string;
    phone?: string;
};

export async function registerUser(data: RegisterInput) {
    // Server-side validation
    const { name, email, password, confirmPassword, department, phone } = data;

    if (!name || !email || !password) {
        return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length < 3) {
        return { error: "รูปแบบอีเมล/username ไม่ถูกต้อง" };
    }

    // Password policy
    if (password.length < 6) {
        return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
    }

    if (password !== confirmPassword) {
        return { error: "รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง" };
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with isApproved = false
    const newUser = await prisma.user.create({
        data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: "DEV",
            isActive: true,
            isApproved: false,
            department: department || null,
            phone: phone || null,
        },
    });

    // Notify all ADMIN users
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
    });

    if (admins.length > 0) {
        await prisma.notification.createMany({
            data: admins.map((admin) => ({
                userId: admin.id,
                title: "🆕 สมัครสมาชิกใหม่",
                message: `${newUser.name} (${newUser.email}) ลงทะเบียนและรอการอนุมัติ`,
                link: "/admin/approvals",
            })),
        });
    }

    return { success: true };
}
