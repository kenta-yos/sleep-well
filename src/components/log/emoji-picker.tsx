"use client";

const levels = [
  { score: 1, emoji: "😫", label: "最悪" },
  { score: 2, emoji: "😔", label: "悪い" },
  { score: 3, emoji: "😐", label: "普通" },
  { score: 4, emoji: "😊", label: "良い" },
  { score: 5, emoji: "😴", label: "最高" },
];

export function EmojiPicker({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {levels.map(({ score, emoji, label }) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(score)}
          className={`flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all ${
            value === score
              ? "border-primary bg-primary/15 scale-110"
              : "border-border bg-surface hover:border-primary/50"
          } ${disabled ? "opacity-50" : ""}`}
        >
          <span className="text-2xl">{emoji}</span>
          <span className="text-[10px] text-text-muted">{label}</span>
        </button>
      ))}
    </div>
  );
}
