"use client";

// src/components/charts/affect-chart.tsx
// TDMS の推移を、意味の異なる2つの問いとして別々の帯に描く。
//
// 8項目から出るのは活性度と安定度の2つで、快適度はその和、覚醒度はその差。
// 同じ2数を45度回して見ているだけなので、4本の線を重ねても情報は増えず、
// 読み手に頭の中での再合成を強いるだけだった。そこで問いを1つずつに分ける:
//   上の帯 = 快適度。「良い日だったか」  快適 ⇔ 不快
//   下の帯 = 覚醒度。「冴えていたか」    冴え ⇔ 眠気
// どちらも0が中立なので、0を境に色が変わる発散エリアで描く。
// 活性度と安定度は内訳としてツールチップに残す。
//
// 2026-09 より前は I-PANAS-SF で記録しており、尺度が違うのでここには出さない。

import { useId } from "react";
import {
  ComposedChart,
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
}

const PLEASANT = "oklch(0.72 0.17 155)"; // accent-green
const UNPLEASANT = "oklch(0.65 0.2 25)"; // accent-red
const ALERT = "oklch(0.8 0.15 85)"; // accent-yellow
const SLEEPY = "oklch(0.7 0.15 250)"; // accent-blue

const LIMIT = 20; // 快適度・覚醒度の理論レンジ

type Row = {
  label: string;
  vitality: number;
  stability: number;
  pleasure: number;
  arousal: number;
};

export function AffectChart({ data }: { data: DataPoint[] }) {
  const rows: Row[] = data
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

  if (rows.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">気分</h3>
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="px-4 text-center text-sm text-text-muted">
            気分チェックインを記録すると、ここに推移が出ます
          </p>
        </div>
      </div>
    );
  }

  const latest = rows[rows.length - 1];
  // SVG ids are document-global: two charts on one page would otherwise both
  // resolve url(#...) to whichever gradient was defined first.
  const uid = useId().replace(/:/g, "");

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">気分</h3>
        <span className="text-xs tabular-nums text-text-muted">
          快適度{" "}
          <span
            className="font-medium"
            style={{ color: latest.pleasure >= 0 ? PLEASANT : UNPLEASANT }}
          >
            {signed(latest.pleasure)}
          </span>
          <span className="mx-1 opacity-30">/</span>
          覚醒度{" "}
          <span
            className="font-medium"
            style={{ color: latest.arousal >= 0 ? ALERT : SLEEPY }}
          >
            {signed(latest.arousal)}
          </span>
        </span>
      </div>

      <Band
        rows={rows}
        dataKey="pleasure"
        title="快適度"
        high="快適"
        low="不快"
        posColor={PLEASANT}
        negColor={UNPLEASANT}
        gradientId={`${uid}-pleasure`}
        showXAxis={false}
      />
      <Band
        rows={rows}
        dataKey="arousal"
        title="覚醒度"
        high="冴え"
        low="眠気"
        posColor={ALERT}
        negColor={SLEEPY}
        gradientId={`${uid}-arousal`}
        showXAxis
      />

      <p className="px-1 text-[11px] leading-relaxed text-text-muted">
        どちらも0が中立です。覚醒度が下に振れた日は「眠くて不活発」なので、睡眠時間や就寝時刻と並べて見られます。
      </p>
    </div>
  );
}

function Band({
  rows,
  dataKey,
  title,
  high,
  low,
  posColor,
  negColor,
  gradientId,
  showXAxis,
}: {
  rows: Row[];
  dataKey: "pleasure" | "arousal";
  title: string;
  high: string;
  low: string;
  posColor: string;
  negColor: string;
  gradientId: string;
  showXAxis: boolean;
}) {
  const offset = zeroOffset(rows.map((r) => r[dataKey]));
  // Aim for ~6 labels; floor of 0 so a couple of days still get labelled.
  const interval = Math.max(0, Math.ceil(rows.length / 6) - 1);

  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between px-1">
        <p className="text-xs font-medium">{title}</p>
        <p className="text-[10px] text-text-muted">
          {high} ⇔ {low}
        </p>
      </div>
      <div className={showXAxis ? "h-28" : "h-24"}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ left: -6, right: 8, top: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`${gradientId}-s`} x1="0" y1="0" x2="0" y2="1">
                {stops(offset, posColor, negColor, 0.95)}
              </linearGradient>
              <linearGradient id={`${gradientId}-f`} x1="0" y1="0" x2="0" y2="1">
                {stops(offset, posColor, negColor, 0.35)}
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              tick={showXAxis ? { fontSize: 9, fill: "#888" } : false}
              interval={interval}
              height={showXAxis ? 18 : 4}
            />
            <YAxis
              domain={[-LIMIT, LIMIT]}
              ticks={[-LIMIT, 0, LIMIT]}
              tick={{ fontSize: 9, fill: "#888" }}
              width={34}
            />
            <ReferenceLine y={0} stroke="#666" />

            {/* baseValue=0, otherwise Recharts fills down to the domain floor
                and the colour split stops meaning anything. */}
            <Area
              type="monotone"
              dataKey={dataKey}
              baseValue={0}
              stroke={`url(#${gradientId}-s)`}
              strokeWidth={2}
              fill={`url(#${gradientId}-f)`}
              dot={{ r: 1.5 }}
              connectNulls
              isAnimationActive={false}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Row;
                const value = d[dataKey];
                return (
                  <div className="rounded-xl border border-border bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="mb-1 text-text-muted">{d.label}</p>
                    <p
                      className="font-medium"
                      style={{ color: value >= 0 ? posColor : negColor }}
                    >
                      {title}: {signed(value)}
                    </p>
                    <p className="mt-1.5 border-t border-border pt-1.5 text-[10px] text-text-muted">
                      内訳 活性度 {signed(d.vitality)}・安定度 {signed(d.stability)}
                    </p>
                  </div>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Where zero falls inside the filled shape, as a 0-1 fraction of its height.
 * The shape runs from max(values, 0) down to min(values, 0) because the area
 * is anchored at zero, and an objectBoundingBox gradient is measured against
 * exactly that box.
 */
function zeroOffset(values: number[]): number {
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  if (max <= 0) return 0;
  if (min >= 0) return 1;
  return max / (max - min);
}

/**
 * A series that never crosses zero gets one solid colour. Emitting two stops
 * pinned at the same end instead paints the whole shape in the *last* one, so
 * an all-positive series came out red.
 */
function stops(
  offset: number,
  posColor: string,
  negColor: string,
  opacity: number
) {
  if (offset >= 1) {
    return <stop offset={0} stopColor={posColor} stopOpacity={opacity} />;
  }
  if (offset <= 0) {
    return <stop offset={0} stopColor={negColor} stopOpacity={opacity} />;
  }
  return (
    <>
      <stop offset={offset} stopColor={posColor} stopOpacity={opacity} />
      <stop offset={offset} stopColor={negColor} stopOpacity={opacity} />
    </>
  );
}

function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}
