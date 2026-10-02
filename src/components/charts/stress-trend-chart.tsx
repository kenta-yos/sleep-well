"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { STRESS_CATEGORIES } from "@/components/log/habits";

// Told apart by lightness as well as hue, so neighbours in a stack still
// separate for colour-blind readers.
const COLORS: Record<string, string> = {
  work: "#3d5fc0",
  friends: "#7fb3e6",
  romance: "#c2569a",
  health: "#2e8b5a",
  money: "#d9a15a",
  future: "#7b5cc4",
  other: "#a3a9b8",
};

interface DataPoint {
  date: string;
  stressSources: Record<string, number> | null;
}

/** Daily stress as a stack: height is the day's total (低1・中2・高3), colour the kind. */
export function StressTrendChart({ data }: { data: DataPoint[] }) {
  const chartData = data.map((d) => ({
    label: d.date.slice(5),
    total: d.stressSources ? Object.values(d.stressSources).reduce((a, b) => a + b, 0) : null,
    ...Object.fromEntries(STRESS_CATEGORIES.map((c) => [c.id, d.stressSources?.[c.id] ?? 0])),
  }));

  const totals: Record<string, number> = {};
  for (const d of data) {
    for (const [k, v] of Object.entries(d.stressSources ?? {})) totals[k] = (totals[k] ?? 0) + v;
  }
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const topLabel = top ? STRESS_CATEGORIES.find((c) => c.id === top[0])?.label : null;

  const xInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold">ストレスの推移</h3>
        {topLabel && (
          <span className="text-xs text-text-muted">
            多かったのは <span className="text-text">{topLabel}</span>
          </span>
        )}
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: -28, right: 5 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#596178" }} interval={xInterval} />
            <YAxis tick={{ fontSize: 10, fill: "#596178" }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(30,35,51,0.05)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                if (d.total == null) return null;
                const items = STRESS_CATEGORIES.filter((c) => d[c.id] > 0);
                return (
                  <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-sm">
                    <p className="text-text-muted">{d.label}</p>
                    {items.length === 0 ? (
                      <p>ストレスなし</p>
                    ) : (
                      items.map((c) => (
                        <p key={c.id}>
                          {c.label}：{["", "低", "中", "高"][d[c.id]]}
                        </p>
                      ))
                    )}
                  </div>
                );
              }}
            />
            {STRESS_CATEGORIES.map((c) => (
              <Bar key={c.id} dataKey={c.id} stackId="s" fill={COLORS[c.id]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
        {STRESS_CATEGORIES.map((c) => (
          <span key={c.id} className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[c.id] }} />
            {c.label}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-text-muted">高さ＝その日のストレス合計（低1・中2・高3）</p>
    </div>
  );
}
