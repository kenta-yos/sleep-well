"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  avgHR: number | null;
  minHR: number | null;
  maxHR: number | null;
}

export function HeartRateChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.avgHR != null)
    .map((d) => ({
      label: d.date.slice(5),
      avg: d.avgHR,
      min: d.minHR,
      max: d.maxHR,
    }));

  if (chartData.length === 0) return null;

  const allVals = chartData.flatMap((d) =>
    [d.avg, d.min, d.max].filter((v): v is number => v != null)
  );
  const yMin = Math.floor(Math.min(...allVals) / 5) * 5 - 5;
  const yMax = Math.ceil(Math.max(...allVals) / 5) * 5 + 5;

  const avgAll =
    chartData.reduce((sum, d) => sum + (d.avg ?? 0), 0) / chartData.length;

  const xInterval = Math.max(1, Math.ceil(chartData.length / 6) - 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">平均心拍数</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: -20, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: "#888" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-[#333] bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{d.label}</p>
                    <p className="font-medium" style={{ color: "oklch(0.65 0.2 25)" }}>
                      平均: {d.avg} bpm
                    </p>
                    {d.min != null && (
                      <p className="text-text-muted">最低: {d.min} bpm</p>
                    )}
                    {d.max != null && (
                      <p className="text-text-muted">最高: {d.max} bpm</p>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={Math.round(avgAll)}
              stroke="#555"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `${Math.round(avgAll)}`,
                position: "right",
                fontSize: 9,
                fill: "#888",
              }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="oklch(0.65 0.2 25)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
