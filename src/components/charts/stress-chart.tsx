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
  stressScore: number | null;
  stressSources: string[] | null;
}

const stressLabels: Record<number, string> = {
  1: "😌 なし",
  2: "😐 軽め",
  3: "😟 そこそこ",
  4: "😰 高い",
  5: "🤯 最大",
};

const sourceLabels: Record<string, string> = {
  work: "仕事",
  friends: "友人関係",
  romance: "恋愛",
  health: "体調・健康",
  money: "金銭",
  future: "将来・生き方",
  other: "その他",
};

export function StressChart({ data }: { data: DataPoint[] }) {
  const chartData = data
    .filter((d) => d.stressScore != null)
    .map((d) => ({
      label: d.date.slice(5),
      stress: d.stressScore,
      sources: d.stressSources,
    }));

  if (chartData.length === 0) return null;

  const xInterval = Math.max(1, Math.ceil(chartData.length / 6) - 1);

  // Aggregate stress source frequency
  const sourceCounts = new Map<string, number>();
  for (const d of chartData) {
    if (d.sources) {
      for (const s of d.sources) {
        sourceCounts.set(s, (sourceCounts.get(s) ?? 0) + 1);
      }
    }
  }
  const sortedSources = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">ストレス度</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: -20, right: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={xInterval}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
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
                const score = item.stress as number;
                const sources = item.sources as string[] | null;
                return (
                  <div className="rounded-xl border border-border bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{label}</p>
                    <p className="font-medium text-text">
                      {stressLabels[score] ?? score}
                    </p>
                    {sources && sources.length > 0 && (
                      <p className="mt-1 text-text-muted">
                        {sources.map((s) => sourceLabels[s] ?? s).join(", ")}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="stress"
              stroke="oklch(0.65 0.2 25)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {sortedSources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedSources.map(([source, count]) => (
            <span
              key={source}
              className="rounded-lg bg-surface px-2 py-0.5 text-[11px] text-text-muted"
            >
              {sourceLabels[source] ?? source}
              <span className="ml-1 text-text">{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
