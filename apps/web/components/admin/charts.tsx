"use client";

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { DayCount, ToolCount, StatusCount } from "@/lib/admin-analytics";

const PRIMARY  = "#c01818";
const COLORS   = ["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16","#ec4899","#14b8a6","#f97316"];
const STATUS_COLORS: Record<string, string> = {
  ready:      "#22c55e",
  failed:     "#ef4444",
  queued:     "#6366f1",
  processing: "#f59e0b",
  expired:    "#94a3b8",
};

const fmtDay  = (d: unknown) => new Date(`${d as string}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtTool = (s: unknown) => (s as string).replace(/-pdf$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── Jobs over time (30 days) ──────────────────────────────────────────────────

export function JobsLineChart({ data }: { data: DayCount[] }) {
  if (!data.length) return <Empty label="No job data yet" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={28} />
        <Tooltip
          contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
          labelFormatter={fmtDay}
          formatter={(v) => [v as number, "Jobs"]}
        />
        <Line type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Popular tools (horizontal bar) ───────────────────────────────────────────

export function PopularToolsChart({ data }: { data: ToolCount[] }) {
  if (!data.length) return <Empty label="No tool data yet" />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="tool" tickFormatter={fmtTool} tick={{ fontSize: 11, fill: "#64748b" }} width={96} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
          formatter={(v, name) => [v as number, name === "total" ? "Total" : "Success"]}
          labelFormatter={fmtTool}
        />
        <Bar dataKey="total"   fill="#e2e8f0" radius={[0, 4, 4, 0]} />
        <Bar dataKey="success" fill={PRIMARY}  radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Status breakdown (donut) ──────────────────────────────────────────────────

export function StatusDonut({ data }: { data: StatusCount[] }) {
  if (!data.length) return <Empty label="No data yet" />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#cbd5e1"} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Page views bar chart ──────────────────────────────────────────────────────

export function PageViewsChart({ data }: { data: { toolId: string; count: number }[] }) {
  if (!data.length) return <Empty label="No page view data yet" />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="toolId" tickFormatter={fmtTool} tick={{ fontSize: 11, fill: "#64748b" }} width={96} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [v as number, "Views"]}
          labelFormatter={fmtTool}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-slate-400">{label}</div>
  );
}
