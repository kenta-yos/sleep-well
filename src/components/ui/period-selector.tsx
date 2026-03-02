"use client";

const periods = [
  { value: 7, label: "7日" },
  { value: 30, label: "30日" },
  { value: 90, label: "90日" },
] as const;

export function PeriodSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (days: number) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
      {periods.map(({ value: days, label }) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`min-h-[36px] flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            value === days
              ? "bg-primary text-white"
              : "text-text-muted hover:text-text"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
