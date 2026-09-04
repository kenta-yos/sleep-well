"use client";

// src/components/charts/affect-chart.tsx
// TDMS を1日1本の棒と1本の折れ線で。
//
// 測っているのは活性度と安定度の2つだけで、快適度はその和、覚醒度はその差。
// 同じ2つの数字を45度傾けて見ているだけなので、4本引いても情報は増えない。
// そこで意味を言葉にしやすい2つを描く:
//   棒   = 快適度（気分の良し悪し）。符号付きなのでゼロを挟んだ発散棒が合う。
//   折線 = 覚醒度（冴え ⇔ 眠気）。睡眠と直接ぶつけられる唯一の軸。
// 活性度と安定度はツールチップに内訳として残す。
//
// 2026-09 より前は I-PANAS-SF で記録しており、尺度が違うのでこの図には出さない。

import {
  ComposedChart,
  Bar,
  Cell,
  Line,
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
}

const PLEASANT_COLOR = "oklch(0.72 0.17 155)"; // accent-green
const UNPLEASANT_COLOR = "oklch(0.65 0.2 25)"; // accent-red
const AROUSAL_COLOR = "oklch(0.8 0.15 85)"; // accent-yellow

const LIMIT = 20; // 快適度・覚醒度の理論レンジ

export function AffectChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.vitality != null && d.stability != null)
    .map((d) => {
      const v = d.vitality as number;
      const s = d.stability as number;
      return {
        label: d.date.slice(5), // MM-DD
        vitality: v,
        stability: s,
        pleasure: v + s,
        arousal: v - s,
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">気分（快適度 / 覚醒度）</h3>
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="px-4 text-center text-sm text-text-muted">
            気分チェックインを記録すると、ここに快適度・覚醒度の推移が出ます
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
        <h3 className="text-sm font-medium">気分（快適度 / 覚醒度）</h3>
        <span className="text-xs tabular-nums text-text-muted">
          直近{" "}
          <span
            className="font-medium"
            style={{
              color: latest.pleasure >= 0 ? PLEASANT_COLOR : UNPLEASANT_COLOR,
            }}
          >
            {signed(latest.pleasure)}
          </span>
          <span className="mx-1 opacity-40">/</span>
          <span className="font-medium" style={{ color: AROUSAL_COLOR }}>
            {signed(latest.arousal)}
          </span>
        </span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: -20, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            <YAxis
              domain={[-LIMIT, LIMIT]}
              ticks={[-20, -10, 0, 10, 20]}
              tick={{ fontSize: 10, fill: "#888" }}
            />

            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-border bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="mb-1 text-text-muted">{d.label}</p>
                    <p
                      className="font-medium"
                      style={{
                        color:
                          d.pleasure >= 0 ? PLEASANT_COLOR : UNPLEASANT_COLOR,
                      }}
                    >
                      快適度: {signed(d.pleasure)}
                    </p>
                    <p className="font-medium" style={{ color: AROUSAL_COLOR }}>
                      覚醒度: {signed(d.arousal)}
                    </p>
                    <p className="mt-1.5 border-t border-border pt-1.5 text-[10px] text-text-muted">
                      内訳 活性度 {signed(d.vitality)}・安定度{" "}
                      {signed(d.stability)}
                    </p>
                  </div>
                );
              }}
            />

            {/* 快適度: ゼロを挟んで上下に伸びる。色が符号を兼ねる。 */}
            <Bar
              dataKey="pleasure"
              radius={[2, 2, 2, 2]}
              maxBarSize={14}
              isAnimationActive={false}
            >
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.pleasure >= 0 ? PLEASANT_COLOR : UNPLEASANT_COLOR}
                  fillOpacity={0.55}
                />
              ))}
            </Bar>

            {/* 覚醒度: 棒の上に重ねて、良い日が「興奮して良い」のか
                「穏やかで良い」のかを読む。 */}
            <Line
              type="monotone"
              dataKey="arousal"
              stroke={AROUSAL_COLOR}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
              isAnimationActive={false}
            />

            <ReferenceLine y={0} stroke="#555" strokeDasharray="2 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
        <Legend color={PLEASANT_COLOR} label="快適度（棒・快 ⇔ 不快）" />
        <Legend color={AROUSAL_COLOR} label="覚醒度（線・冴え ⇔ 眠気）" />
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-text-muted">
        棒が高く線も高い日は「興奮して気分が良い」、棒が高く線が低い日は「穏やかで気分が良い」。線が低い日は眠気側なので、睡眠と結びつけて見られます。
      </p>
    </div>
  );
}

function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-0.5 w-4" style={{ background: color }} />
      {label}
    </span>
  );
}
