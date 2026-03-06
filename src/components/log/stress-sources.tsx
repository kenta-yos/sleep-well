"use client";

const categories = [
  { id: "work", label: "仕事" },
  { id: "friends", label: "友人関係" },
  { id: "romance", label: "恋愛" },
  { id: "health", label: "体調・健康" },
  { id: "money", label: "金銭" },
  { id: "future", label: "将来・生き方" },
  { id: "other", label: "その他" },
];

const scoreStyles: Record<number, string> = {
  0: "border-border bg-surface text-text-muted",
  1: "border-accent-purple/40 bg-accent-purple/10 text-text",
  2: "border-accent-purple/70 bg-accent-purple/20 text-text",
  3: "border-accent-purple bg-accent-purple/35 text-text",
};

const scoreLabels: Record<number, string> = {
  0: "−",
  1: "低",
  2: "中",
  3: "高",
};

export function StressSources({
  scores,
  onChange,
}: {
  scores: Record<string, number>;
  onChange: (scores: Record<string, number>) => void;
}) {
  function cycle(id: string) {
    const current = scores[id] ?? 0;
    const next = (current + 1) % 4;
    const updated = { ...scores };
    if (next === 0) {
      delete updated[id];
    } else {
      updated[id] = next;
    }
    onChange(updated);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(({ id, label }) => {
        const score = scores[id] ?? 0;
        return (
          <button
            key={id}
            type="button"
            onClick={() => cycle(id)}
            className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm transition-all ${scoreStyles[score]}`}
          >
            <span>{label}</span>
            <span className="min-w-[1.2em] text-center text-xs font-bold">
              {scoreLabels[score]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
