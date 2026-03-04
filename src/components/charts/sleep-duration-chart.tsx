"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface DataPoint {
  date: string;
  deep: number;
  light: number;
  rem: number;
  totalMinutes: number;
  freshness?: number;
}

function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function SleepDurationChart({ data }: { data: DataPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
    deepH: +(d.deep / 60).toFixed(1),
    lightH: +(d.light / 60).toFixed(1),
    remH: +(d.rem / 60).toFixed(1),
  }));

  if (chartData.length === 0) {
    return <EmptyChart message="睡眠データがありません" />;
  }

  const xInterval = Math.max(1, Math.ceil(chartData.length / 6) - 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">睡眠時間 & すっきり度</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: -20, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "#888" }}
              domain={[0, "auto"]}
              label={{ value: "時間", angle: -90, position: "insideLeft", fontSize: 10, fill: "#888" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 5]}
              tick={{ fontSize: 10, fill: "#888" }}
              hide
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                if (!d.totalMinutes && !d.freshness) return null;
                return (
                  <div className="rounded-xl border border-[#333] bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{d.label}</p>
                    {d.totalMinutes > 0 && (
                      <p className="font-medium text-primary">{formatMin(d.totalMinutes)}</p>
                    )}
                    {d.deepH > 0 && <p>深い: {d.deepH}h</p>}
                    {d.lightH > 0 && <p>浅い: {d.lightH}h</p>}
                    {d.remH > 0 && <p>REM: {d.remH}h</p>}
                    {d.freshness != null && <p>すっきり度: {d.freshness}/5</p>}
                  </div>
                );
              }}
            />
            <Bar yAxisId="left" dataKey="deepH" stackId="sleep" fill="oklch(0.5 0.2 270)" radius={[0, 0, 0, 0]} />
            <Bar yAxisId="left" dataKey="lightH" stackId="sleep" fill="oklch(0.7 0.12 250)" radius={[0, 0, 0, 0]} />
            <Bar yAxisId="left" dataKey="remH" stackId="sleep" fill="oklch(0.65 0.18 300)" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="freshness"
              stroke="oklch(0.72 0.17 155)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-surface">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
