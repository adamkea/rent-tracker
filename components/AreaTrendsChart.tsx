"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  year: number;
  avg: number;
  change: number | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DataPoint }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-emerald-700 font-medium">
        €{d.avg.toLocaleString("en-IE")}/mo
      </p>
      {d.change != null && (
        <p className={d.change > 0 ? "text-red-600" : "text-emerald-600"}>
          {d.change > 0 ? "+" : ""}
          {d.change.toFixed(1)}% YoY
        </p>
      )}
    </div>
  );
}

export default function AreaTrendsChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#059669"
          strokeWidth={2.5}
          dot={{ fill: "#059669", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#059669" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
