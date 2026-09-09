"use client";

type Props = {
    password: string;
};

function getStrength(password: string): { score: number; label: string; color: string; bgColor: string } {
    if (!password) return { score: 0, label: "", color: "", bgColor: "" };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: "อ่อน (Weak)", color: "text-rose-600", bgColor: "bg-rose-500" };
    if (score <= 2) return { score: 2, label: "พอใช้ (Fair)", color: "text-amber-600", bgColor: "bg-amber-500" };
    if (score <= 3) return { score: 3, label: "ดี (Good)", color: "text-blue-600", bgColor: "bg-blue-500" };
    return { score: 4, label: "แข็งแรงมาก (Strong)", color: "text-emerald-600", bgColor: "bg-emerald-500" };
}

export default function PasswordStrength({ password }: Props) {
    const strength = getStrength(password);
    if (!password) return null;

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                            level <= strength.score ? strength.bgColor : "bg-slate-200"
                        }`}
                    />
                ))}
            </div>
            <p className={`text-[11px] font-semibold ${strength.color}`}>{strength.label}</p>
        </div>
    );
}
