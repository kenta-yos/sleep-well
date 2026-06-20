"use client";

// src/components/charts/pss-trend-chart.tsx
// PSS-10（知覚ストレス, 0-40）の推移。週1カデンス想定なので connectNulls で点をつなぐ。
// 0-13 低 / 14-26 中 / 27-40 高 をバンド背景で表示。

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  pss: number | null; // 0-40
}

const LOW = "oklch(0.72 0.17 155)"; // green
const MID = "oklch(0.8 0.15 85)"; // yellow
const HIGH = "oklch(0.65 0.2 25)"; // red

function bandColor(score: number): string {
  if (score <= 13) return LOW;
  if (score <= 26) return MID;
  return HIGH;
}
function bandLabel(score: number): string {
  if (score <= 13) return "低め";
  if (score <= 26) return "中程度";
  return "高め";
}

export function PssTrendChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.pss != null)
    .map((d) => ({ label: d.date.slice(5), pss: d.pss as number }));

  if (chartData.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">知覚ストレス（PSS-10）</h3>
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="px-4 text-center text-sm text-text-muted">
            PSSを記録すると、ここに推移が出ます（週1回が目安）
          </p>
        </div>
      </div>
    );
  }

  const xInterval = Math.max(1, Math.ceil(chartData.length / 6) - 1);
  const latest = chartData[chartData.length - 1];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">知覚ストレス（PSS-10）</h3>
        <span className="text-xs tabular-nums" style={{ color: bandColor(latest.pss) }}>
          直近 {latest.pss}{" "}
          <span className="text-text-muted">/ 40・{bandLabel(latest.pss)}</span>
        </span>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: -20, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            <YAxis
              domain={[0, 40]}
              ticks={[0, 13, 26, 40]}
              tick={{ fontSize: 10, fill: "#888" }}
            />
            {/* バンド背景 */}
            <ReferenceArea y1={0} y2={13} fill={LOW} fillOpacity={0.07} />
            <ReferenceArea y1={13} y2={26} fill={MID} fillOpacity={0.07} />
            <ReferenceArea y1={26} y2={40} fill={HIGH} fillOpacity={0.07} />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-border bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{d.label}</p>
                    <p className="font-medium" style={{ color: bandColor(d.pss) }}>
                      {d.pss} / 40・{bandLabel(d.pss)}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="pss"
              stroke="oklch(0.7 0.15 250)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-text-muted">
        目安: 0–13 低め / 14–26 中程度 / 27–40 高め（厳密な臨床カットオフではありません）
      </p>
    </div>
  );
}
