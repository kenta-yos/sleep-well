"use client";

// src/components/charts/affect-chart.tsx
// PANAS のポジ感情(PA)・ネガ感情(NA)を時系列で。すっきり度を右軸に重ねて
// 「身体は整ってるのに休まらない日、感情側で何が起きてるか」を眺める用。
// 既存の sleep-duration-chart / heart-rate-chart と同じ作法（recharts / oklch / token classes）。

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  pa: number | null; // ポジ感情合計 10-50
  na: number | null; // ネガ感情合計 10-50
  freshness?: number; // すっきり度 1-5（参照用・任意）
}

const PA_COLOR = "oklch(0.72 0.17 155)"; // accent-green
const NA_COLOR = "oklch(0.65 0.2 25)"; // accent-red
const FRESH_COLOR = "oklch(0.8 0.15 85)"; // accent-yellow

export function AffectChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.pa != null || d.na != null)
    .map((d) => ({
      label: d.date.slice(5), // MM-DD
      pa: d.pa,
      na: d.na,
      balance: d.pa != null && d.na != null ? d.pa - d.na : null,
      freshness: d.freshness ?? null,
    }));

  if (chartData.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">気分（ポジ / ネガ）</h3>
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="px-4 text-center text-sm text-text-muted">
            夜のチェックインを記録すると、ここにポジ・ネガの推移が出ます
          </p>
        </div>
      </div>
    );
  }

  const xInterval = Math.max(1, Math.ceil(chartData.length / 6) - 1);

  // 直近の値（ヘッダーの一言用）
  const latest = [...chartData].reverse().find((d) => d.balance != null);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">気分（ポジ / ネガ）</h3>
        {latest?.balance != null && (
          <span className="text-xs text-text-muted tabular-nums">
            直近バランス{" "}
            <span
              className="font-medium"
              style={{ color: latest.balance >= 0 ? PA_COLOR : NA_COLOR }}
            >
              {latest.balance > 0 ? "+" : ""}
              {latest.balance}
            </span>
          </span>
        )}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: -20, right: 5 }}>
            <defs>
              <linearGradient id="paFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PA_COLOR} stopOpacity={0.18} />
                <stop offset="100%" stopColor={PA_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            {/* 左軸: PA / NA（10-50） */}
            <YAxis
              yAxisId="affect"
              domain={[5, 25]}
              ticks={[5, 10, 15, 20, 25]}
              tick={{ fontSize: 10, fill: "#888" }}
            />
            {/* 右軸: すっきり度（1-5・非表示） */}
            <YAxis
              yAxisId="fresh"
              orientation="right"
              domain={[1, 5]}
              tick={{ fontSize: 10, fill: "#888" }}
              hide
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-border bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{d.label}</p>
                    {d.pa != null && (
                      <p style={{ color: PA_COLOR }}>ポジ: {d.pa}</p>
                    )}
                    {d.na != null && (
                      <p style={{ color: NA_COLOR }}>ネガ: {d.na}</p>
                    )}
                    {d.balance != null && (
                      <p className="font-medium text-text">
                        バランス: {d.balance > 0 ? "+" : ""}
                        {d.balance}
                      </p>
                    )}
                    {d.freshness != null && (
                      <p className="text-text-muted">
                        すっきり度: {d.freshness}/5
                      </p>
                    )}
                  </div>
                );
              }}
            />

            {/* PA を面で強調 */}
            <Area
              yAxisId="affect"
              type="monotone"
              dataKey="pa"
              stroke={PA_COLOR}
              strokeWidth={2}
              fill="url(#paFill)"
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              yAxisId="affect"
              type="monotone"
              dataKey="na"
              stroke={NA_COLOR}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
            {/* すっきり度（点線・参照） */}
            <Line
              yAxisId="fresh"
              type="monotone"
              dataKey="freshness"
              stroke={FRESH_COLOR}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              connectNulls
            />
            <ReferenceLine yAxisId="affect" y={15} stroke="#444" strokeDasharray="2 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
        <Legend color={PA_COLOR} label="ポジ感情 (PA)" />
        <Legend color={NA_COLOR} label="ネガ感情 (NA)" />
        <Legend color={FRESH_COLOR} label="すっきり度（右軸）" dashed />
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-text-muted">
        PAとNAは独立した2軸。「両方高い日（充実だが気を張った）」もありえます。
      </p>
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-0.5 w-4"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}
