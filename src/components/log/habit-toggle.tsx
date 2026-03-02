"use client";

export function HabitToggle({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm transition-all ${
        checked
          ? "border-primary bg-primary/15 text-text"
          : "border-border bg-surface text-text-muted"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
