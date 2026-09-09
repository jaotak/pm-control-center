"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type DataPoint = { name: string; value: number; color: string };

export default function UATPassRateDonut({ data }: { data: DataPoint[] }) {
    const filtered = data.filter(d => d.value > 0);
    const total = data.reduce((s, d) => s + d.value, 0);

    if (total === 0) {
        return (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm font-medium">
                No UAT Cases yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={filtered}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                >
                    {filtered.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [`${Number(value)} cases`, ""]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600" }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
