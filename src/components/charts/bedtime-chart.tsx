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
  bedtime: string | null; // ISO timestamp
  wakeTime: string | null;
}

function timeToMinutes(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  // Convert to JST
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  let hours = jst.getUTCHours();
  const minutes = jst.getUTCMinutes();
  // Normalize bedtime: if before 12:00, add 24 (e.g., 1:00 AM = 25:00)
  if (hours < 12) hours += 24;
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export function BedtimeChart({ data }: { data: DataPoint[] }) {
  const chartData = data.map((d) => ({
    label: d.date.slice(5),
    bedtime: timeToMinutes(d.bedtime),
    wakeTime: d.wakeTime
      ? (() => {
          const dt = new Date(d.wakeTime);
          const jst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
          return jst.getUTCHours() * 60 + jst.getUTCMinutes();
        })()
      : null,
  }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">就寝・起床時刻</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: -10, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888" }}
              domain={["auto", "auto"]}
              tickFormatter={(v) => minutesToTime(v)}
              reversed
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "12px",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                minutesToTime(value),
                name === "bedtime" ? "就寝" : "起床",
              ]}
            />
            <Line
              type="monotone"
              dataKey="bedtime"
              stroke="oklch(0.7 0.15 250)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="wakeTime"
              stroke="oklch(0.8 0.15 85)"
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
