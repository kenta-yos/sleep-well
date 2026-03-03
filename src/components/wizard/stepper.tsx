"use client";

import { useState, useRef } from "react";
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
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function increment() {
    onChange(clampStep(value + step, min, max, step));
  }

  function decrement() {
    onChange(clampStep(value - step, min, max, step));
  }

  function startEditing() {
    setInputValue(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit() {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num)) {
      onChange(clampStep(num, min, max, step));
    }
    setEditing(false);
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

        {editing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            className="w-16 rounded-lg bg-background px-2 py-1 text-center text-lg font-bold text-text outline-none ring-1 ring-primary"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="min-w-[48px] text-center text-lg font-bold text-text"
          >
            {display}
            {unit && (
              <span className="ml-0.5 text-xs font-normal text-text-muted">
                {unit}
              </span>
            )}
          </button>
        )}

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
