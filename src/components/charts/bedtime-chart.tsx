"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  bedtime: string | null; // ISO timestamp
  wakeTime: string | null;
}

// Pivot at 18:00 — maps all times to a continuous "night axis"
// 18:00→0, 20:00→120, 22:00→240, 0:00→360, 2:00→480, ..., 8:00→840
const PIVOT_HOUR = 18;

function toNightMinutes(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  let h = jst.getUTCHours();
  const m = jst.getUTCMinutes();
  // Hours before pivot (morning) → add 24 to make them after midnight
  if (h < PIVOT_HOUR) h += 24;
  return (h - PIVOT_HOUR) * 60 + m;
}

function nightMinutesToTime(nm: number): string {
  const totalMin = nm + PIVOT_HOUR * 60;
  const h = Math.floor(totalMin / 60) % 24;
  const m = Math.round(totalMin % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function formatDuration(bedNM: number, wakeNM: number): string {
  const diff = wakeNM - bedNM;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

// Ideal: 0:00 bedtime = (24-18)*60 = 360, 8:00 wake = (8+24-18)*60 = 840
const IDEAL_BED = (24 - PIVOT_HOUR) * 60; // 360
const IDEAL_WAKE = (8 + 24 - PIVOT_HOUR) * 60; // 840

export function BedtimeChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.bedtime && d.wakeTime)
    .map((d) => {
      const bedNM = toNightMinutes(d.bedtime)!;
      const wakeNM = toNightMinutes(d.wakeTime)!;
      return {
        label: d.date.slice(5),
        sleepRange: [bedNM, wakeNM] as [number, number],
        bedNM,
        wakeNM,
      };
    });

  if (chartData.length === 0) {
    return null;
  }

  const xInterval = Math.max(1, Math.ceil(chartData.length / 6) - 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">睡眠ウィンドウ</h3>
      <p className="text-[11px] text-text-muted">帯 = 睡眠時間 / 点線 = 理想 (0:00–8:00)</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: -10, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888" }}
              domain={[
                (dataMin: number) => Math.min(dataMin, IDEAL_BED) - 30,
                (dataMax: number) => Math.max(dataMax, IDEAL_WAKE) + 30,
              ]}
              tickFormatter={(v) => nightMinutesToTime(v)}
              ticks={generateTicks(chartData)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-[#333] bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{d.label}</p>
                    <p>就寝: {nightMinutesToTime(d.bedNM)}</p>
                    <p>起床: {nightMinutesToTime(d.wakeNM)}</p>
                    <p className="font-medium text-primary">
                      {formatDuration(d.bedNM, d.wakeNM)}
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={IDEAL_BED}
              stroke="oklch(0.6 0.15 155)"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: "0:00", position: "right", fontSize: 9, fill: "oklch(0.6 0.15 155)" }}
            />
            <ReferenceLine
              y={IDEAL_WAKE}
              stroke="oklch(0.6 0.15 155)"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: "8:00", position: "right", fontSize: 9, fill: "oklch(0.6 0.15 155)" }}
            />
            <Area
              type="monotone"
              dataKey="sleepRange"
              fill="oklch(0.55 0.15 270 / 0.4)"
              stroke="oklch(0.7 0.15 270)"
              strokeWidth={1.5}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function generateTicks(
  data: { bedNM: number; wakeNM: number }[]
): number[] {
  if (data.length === 0) return [];
  const allMin = Math.min(...data.map((d) => d.bedNM), IDEAL_BED);
  const allMax = Math.max(...data.map((d) => d.wakeNM), IDEAL_WAKE);
  const ticks: number[] = [];
  const start = Math.floor(allMin / 120) * 120;
  const end = Math.ceil(allMax / 120) * 120;
  for (let m = start; m <= end; m += 120) {
    ticks.push(m);
  }
  return ticks;
}
