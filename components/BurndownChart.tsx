"use client";

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Legend
} from "recharts";

type DataPoint = {
    date: string;     // formatted date label
    logged: number;   // cumulative hours logged up to this date
    estimated: number; // total estimated hours (flat reference line)
};

type Props = {
    data: DataPoint[];
    totalEstimated: number;
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-lg text-xs">
            <p className="font-bold text-slate-700 mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
                    {p.name}: {p.value.toFixed(1)}h
                </p>
            ))}
        </div>
    );
};

export default function BurndownChart({ data, totalEstimated }: Props) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                ยังไม่มีข้อมูล Time Tracking
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}h`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
                <ReferenceLine
                    y={totalEstimated}
                    stroke="#f59e0b"
                    strokeDasharray="6 3"
                    label={{ value: `Budget: ${totalEstimated}h`, fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }}
                />
                <Line
                    type="monotone"
                    dataKey="logged"
                    name="Hours Logged"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#6366f1" }}
                    activeDot={{ r: 5 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
