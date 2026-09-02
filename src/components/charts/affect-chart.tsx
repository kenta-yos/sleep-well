"use client";

// src/components/charts/affect-chart.tsx
// TDMS の活性度・安定度を時系列で。すっきり度を右軸に重ねて
// 「身体は整ってるのに休まらない日、感情側で何が起きてるか」を眺める用。
// 既存の sleep-duration-chart / heart-rate-chart と同じ作法（recharts / oklch / token classes）。
//
// 2026-09 より前は I-PANAS-SF で記録しており、尺度が違うのでこの図には出さない。
// 過去の値は各日のログ画面と月次サマリーで読める。

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
  vitality: number | null; // 活性度 -10〜+10
  stability: number | null; // 安定度 -10〜+10
  freshness?: number; // すっきり度 1-5（参照用・任意）
}

const VITALITY_COLOR = "oklch(0.72 0.17 155)"; // accent-green
const STABILITY_COLOR = "oklch(0.7 0.15 250)"; // accent-blue
const FRESH_COLOR = "oklch(0.8 0.15 85)"; // accent-yellow

export function AffectChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.vitality != null || d.stability != null)
    .map((d) => ({
      label: d.date.slice(5), // MM-DD
      vitality: d.vitality,
      stability: d.stability,
      pleasure:
        d.vitality != null && d.stability != null ? d.vitality + d.stability : null,
      arousal:
        d.vitality != null && d.stability != null ? d.vitality - d.stability : null,
      freshness: d.freshness ?? null,
    }));

  if (chartData.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">気分（活性度 / 安定度）</h3>
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="px-4 text-center text-sm text-text-muted">
            気分チェックインを記録すると、ここに活性度・安定度の推移が出ます
          </p>
        </div>
      </div>
    );
  }

  const xInterval = Math.max(1, Math.ceil(chartData.length / 6) - 1);
  const latest = [...chartData].reverse().find((d) => d.pleasure != null);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">気分（活性度 / 安定度）</h3>
        {latest?.pleasure != null && (
          <span className="text-xs tabular-nums text-text-muted">
            直近快適度{" "}
            <span
              className="font-medium"
              style={{
                color: latest.pleasure >= 0 ? VITALITY_COLOR : "oklch(0.65 0.2 25)",
              }}
            >
              {latest.pleasure > 0 ? "+" : ""}
              {latest.pleasure}
            </span>
          </span>
        )}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: -20, right: 5 }}>
            <defs>
              <linearGradient id="vitalityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={VITALITY_COLOR} stopOpacity={0.18} />
                <stop offset="100%" stopColor={VITALITY_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            {/* 左軸: 活性度 / 安定度（-10〜+10） */}
            <YAxis
              yAxisId="affect"
              domain={[-10, 10]}
              ticks={[-10, -5, 0, 5, 10]}
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
                    {d.vitality != null && (
                      <p style={{ color: VITALITY_COLOR }}>
                        活性度: {d.vitality > 0 ? "+" : ""}
                        {d.vitality}
                      </p>
                    )}
                    {d.stability != null && (
                      <p style={{ color: STABILITY_COLOR }}>
                        安定度: {d.stability > 0 ? "+" : ""}
                        {d.stability}
                      </p>
                    )}
                    {d.pleasure != null && (
                      <p className="font-medium text-text">
                        快適度: {d.pleasure > 0 ? "+" : ""}
                        {d.pleasure}
                      </p>
                    )}
                    {d.arousal != null && (
                      <p className="text-text-muted">
                        覚醒度: {d.arousal > 0 ? "+" : ""}
                        {d.arousal}
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

            <Area
              yAxisId="affect"
              type="monotone"
              dataKey="vitality"
              stroke={VITALITY_COLOR}
              strokeWidth={2}
              fill="url(#vitalityFill)"
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              yAxisId="affect"
              type="monotone"
              dataKey="stability"
              stroke={STABILITY_COLOR}
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
            {/* 0 が中立。上下どちらにも振れる。 */}
            <ReferenceLine yAxisId="affect" y={0} stroke="#444" strokeDasharray="2 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
        <Legend color={VITALITY_COLOR} label="活性度（元気 ⇔ だるい）" />
        <Legend color={STABILITY_COLOR} label="安定度（落ち着き ⇔ 緊張）" />
        <Legend color={FRESH_COLOR} label="すっきり度（右軸）" dashed />
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-text-muted">
        2軸は独立。快適度は2つの和、覚醒度は差です。覚醒度が低い日は「眠くて不活発」で、睡眠と結びつけて見る価値があります。
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
