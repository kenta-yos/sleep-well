"use client";

import { clampStep } from "@/lib/sleep-utils";

export function Stepper({
  value,
  onChange,
  min,
  max,
  step,
  label,
  unit,
  formatValue,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  unit?: string;
  formatValue?: (v: number) => string;
}) {
  function increment() {
    onChange(clampStep(value + step, min, max, step));
  }

  function decrement() {
    onChange(clampStep(value - step, min, max, step));
  }

  const display = formatValue ? formatValue(value) : `${value}`;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-background text-lg font-bold text-text transition-colors hover:bg-surface-hover disabled:opacity-30"
        >
          −
        </button>

        <span className="min-w-[48px] text-center text-lg font-bold text-text">
          {display}
          {unit && (
            <span className="ml-0.5 text-xs font-normal text-text-muted">
              {unit}
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-background text-lg font-bold text-text transition-colors hover:bg-surface-hover disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
