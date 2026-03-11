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
  stressSources: Record<string, number> | null;
}

const sourceLabels: Record<string, string> = {
  work: "仕事",
  friends: "友人関係",
  romance: "恋愛",
  health: "体調・健康",
  money: "金銭",
  future: "将来・生き方",
  other: "その他",
};

function getTotal(sources: Record<string, number> | null): number {
  if (!sources) return 0;
  return Object.values(sources).reduce((sum, v) => sum + v, 0);
}

export function StressChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.stressSources != null)
    .map((d) => ({
      label: d.date.slice(5),
      total: getTotal(d.stressSources),
      sources: d.stressSources,
    }));

  if (chartData.length === 0) return null;

  const xInterval = Math.max(1, Math.ceil(chartData.length / 6) - 1);

  // Aggregate category totals across the period
  const categoryTotals = new Map<string, number>();
  for (const d of chartData) {
    if (d.sources) {
      for (const [key, val] of Object.entries(d.sources)) {
        categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + val);
      }
    }
  }
  const sortedCategories = [...categoryTotals.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  const maxCategoryTotal = sortedCategories[0]?.[1] ?? 1;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">ストレス（合計）</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: -20, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            <YAxis
              domain={[0, 21]}
              ticks={[0, 7, 14, 21]}
              tick={{ fontSize: 10, fill: "#888" }}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "12px",
                fontSize: 12,
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload;
                const sources = item.sources as Record<string, number> | null;
                const total = item.total as number;
                return (
                  <div className="rounded-xl border border-border bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{label}</p>
                    <p className="font-medium text-text">合計: {total}</p>
                    {sources && (
                      <div className="mt-1 space-y-0.5">
                        {Object.entries(sources)
                          .filter(([, v]) => v > 0)
                          .sort((a, b) => b[1] - a[1])
                          .map(([key, val]) => (
                            <p key={key} className="text-text-muted">
                              {sourceLabels[key] ?? key}: {val}
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="oklch(0.65 0.2 25)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {sortedCategories.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-text-muted">カテゴリ別（期間合計）</p>
          {sortedCategories.map(([source, total]) => (
            <div key={source} className="flex items-center gap-2">
              <span className="w-20 text-[11px] text-text-muted">
                {sourceLabels[source] ?? source}
              </span>
              <div className="flex-1">
                <div
                  className="h-3 rounded bg-accent-purple/50"
                  style={{
                    width: `${(total / maxCategoryTotal) * 100}%`,
                  }}
                />
              </div>
              <span className="w-6 text-right text-[11px] text-text">
                {total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
