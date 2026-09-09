"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type DataPoint = { name: string; value: number; color: string };

export default function IssueSeverityChart({ data }: { data: DataPoint[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);

    if (total === 0) {
        return (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm font-medium">
                No Issues logged yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barSize={36}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                    formatter={(value) => [`${Number(value)} issues`, ""]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600" }}
                    cursor={{ fill: "rgba(99,102,241,0.05)" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
