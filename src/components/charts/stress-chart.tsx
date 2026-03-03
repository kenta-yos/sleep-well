"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  stressScore: number | null;
}

const stressLabels: Record<number, string> = {
  1: "😌 なし",
  2: "😐 軽め",
  3: "😟 そこそこ",
  4: "😰 高い",
  5: "🤯 最大",
};

export function StressChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.stressScore != null)
    .map((d) => ({
      label: d.date.slice(5),
      stress: d.stressScore,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">ストレス度</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: -20, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 10, fill: "#888" }}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "12px",
                fontSize: 12,
              }}
              formatter={(value: number) => [
                stressLabels[value] ?? `${value}`,
                "ストレス",
              ]}
            />
            <Line
              type="monotone"
              dataKey="stress"
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
