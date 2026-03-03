"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  bedtime: string | null; // ISO timestamp
  wakeTime: string | null;
}

// Bedtime: normalize to "evening minutes" (hours < 12 → +24h)
function bedtimeToMinutes(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  let hours = jst.getUTCHours();
  const minutes = jst.getUTCMinutes();
  if (hours < 12) hours += 24;
  return hours * 60 + minutes;
}

// Wake time: morning hours (no normalization)
function wakeTimeToMinutes(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.getUTCHours() * 60 + jst.getUTCMinutes();
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function formatDuration(bedM: number, wakeM: number): string {
  const diff = bedM - wakeM; // bedM is normalized evening, wakeM is morning
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function BedtimeChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.bedtime && d.wakeTime)
    .map((d) => {
      const bedM = bedtimeToMinutes(d.bedtime)!;
      const wakeM = wakeTimeToMinutes(d.wakeTime)!;
      return {
        label: d.date.slice(5),
        sleepRange: [wakeM, bedM] as [number, number],
        bedtime: bedM,
        wakeTime: wakeM,
      };
    });

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">睡眠ウィンドウ</h3>
      <p className="text-[11px] text-text-muted">帯の幅 = 就寝から起床までの時間</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: -10, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888" }}
              domain={["dataMin - 30", "dataMax + 30"]}
              tickFormatter={(v) => minutesToTime(v)}
              ticks={generateTicks(chartData)}
              reversed
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "12px",
                fontSize: 12,
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-[#333] bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{d.label}</p>
                    <p>就寝: {minutesToTime(d.bedtime)}</p>
                    <p>起床: {minutesToTime(d.wakeTime)}</p>
                    <p className="font-medium text-primary">
                      {formatDuration(d.bedtime, d.wakeTime)}
                    </p>
                  </div>
                );
              }}
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

// Generate sensible hour ticks spanning the data range
function generateTicks(
  data: { bedtime: number; wakeTime: number }[]
): number[] {
  if (data.length === 0) return [];
  const allMin = Math.min(...data.map((d) => d.wakeTime));
  const allMax = Math.max(...data.map((d) => d.bedtime));
  const ticks: number[] = [];
  // Round to nearest hour, step by 2h
  const start = Math.floor(allMin / 120) * 120;
  const end = Math.ceil(allMax / 120) * 120;
  for (let m = start; m <= end; m += 120) {
    ticks.push(m);
  }
  return ticks;
}
