"use client";

interface DataPoint {
  date: string;
  stressSources: Record<string, number> | null;
}

const categories: { id: string; label: string }[] = [
  { id: "work", label: "仕事" },
  { id: "friends", label: "友人関係" },
  { id: "romance", label: "恋愛" },
  { id: "health", label: "体調・健康" },
  { id: "money", label: "金銭" },
  { id: "future", label: "将来・生き方" },
  { id: "other", label: "その他" },
];

// 0 = no data, 1..4 = score 0..3
function cellStyle(score: number | null): React.CSSProperties {
  if (score == null || score === 0) {
    return { background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.08)" };
  }
  if (score === 1) return { background: "oklch(0.60 0.13 230)" }; // blue
  if (score === 2) return { background: "oklch(0.70 0.17 60)" };  // amber
  return { background: "oklch(0.60 0.22 25)" };                    // red
}

function scoreLabel(score: number | null): string {
  if (score == null) return "記録なし";
  if (score === 0) return "なし";
  if (score === 1) return "低";
  if (score === 2) return "中";
  return "高";
}

export function StressHeatmap({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return null;

  // Decide tick labels for the date row: ~6 labels evenly spaced
  const labelInterval = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">ストレスの種類 × 日付</h3>
        <p className="text-[11px] text-text-muted">
          色が濃いほど強い（低 / 中 / 高）。灰色は記録なし。
        </p>
      </div>

      <div>
        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: `max-content repeat(${data.length}, minmax(0, 1fr))`,
          }}
        >
          {categories.map((cat) => (
            <div key={cat.id} className="contents">
              <div className="pr-2 text-[11px] text-text-muted flex items-center whitespace-nowrap">
                {cat.label}
              </div>
              {data.map((d) => {
                const score = d.stressSources
                  ? d.stressSources[cat.id] ?? 0
                  : null;
                return (
                  <div
                    key={`${cat.id}-${d.date}`}
                    className="aspect-square rounded-[3px]"
                    style={cellStyle(score)}
                    title={`${d.date.slice(5)} ${cat.label}: ${scoreLabel(score)}`}
                  />
                );
              })}
            </div>
          ))}

          {/* Date axis row */}
          <div />
          {data.map((d, i) => (
            <div
              key={`label-${d.date}`}
              className="text-center text-[9px] text-text-muted leading-tight pt-1"
            >
              {i % labelInterval === 0 ? d.date.slice(5) : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-[3px]" style={cellStyle(0)} />
          なし
        </span>
        <span className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-[3px]" style={cellStyle(1)} />
          低
        </span>
        <span className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-[3px]" style={cellStyle(2)} />
          中
        </span>
        <span className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-[3px]" style={cellStyle(3)} />
          高
        </span>
      </div>
    </div>
  );
}
