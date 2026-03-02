"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DataPoint {
  date: string;
  sleepScore: number | null;
}

export function SleepScoreChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.sleepScore != null)
    .map((d) => ({
      label: d.date.slice(5),
      score: d.sleepScore,
    }));

  if (chartData.length === 0) return null;

  const avgScore =
    chartData.reduce((sum, d) => sum + (d.score ?? 0), 0) / chartData.length;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">
        睡眠スコア
        <span className="ml-2 text-xs text-text-muted">
          平均 {avgScore.toFixed(0)}点
        </span>
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: -20, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[30, 100]}
              tick={{ fontSize: 10, fill: "#888" }}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "12px",
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}点`, "スコア"]}
            />
            <ReferenceLine
              y={avgScore}
              stroke="#555"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="oklch(0.7 0.15 250)"
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
