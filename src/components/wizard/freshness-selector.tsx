"use client";

const levels = [
  { score: 1, emoji: "😫", label: "最悪" },
  { score: 2, emoji: "😔", label: "悪い" },
  { score: 3, emoji: "😐", label: "普通" },
  { score: 4, emoji: "😊", label: "良い" },
  { score: 5, emoji: "😴", label: "最高" },
];

export function FreshnessSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (score: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {levels.map(({ score, emoji, label }) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className={`flex min-h-[64px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all ${
            value === score
              ? "border-primary bg-primary/15 scale-105"
              : "border-border bg-surface hover:border-primary/50"
          }`}
        >
          <span className="text-2xl">{emoji}</span>
          <span className="text-[10px] text-text-muted">{label}</span>
        </button>
      ))}
    </div>
  );
}
