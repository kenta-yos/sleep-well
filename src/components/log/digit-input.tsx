"use client";

import { useState } from "react";

// "duration" and "clock" values are minutes, typed as HHMM (7h50m → 0750).
// "count" is a plain integer such as heart rate.
type Kind = "duration" | "clock" | "count";

function toDigits(kind: Kind, value: number) {
  if (kind === "count") return String(value);
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}`;
}

function format(kind: Kind, value: number) {
  if (kind === "count") return String(value);
  const h = Math.floor(value / 60);
  const m = String(value % 60).padStart(2, "0");
  return kind === "clock" ? `${String(h).padStart(2, "0")}:${m}` : `${h}:${m}`;
}

/** Digits are read right-aligned, so "45" is 0:45 and "750" is 7:50. */
function parse(kind: Kind, digits: string, min: number, max: number) {
  if (digits === "") return null;
  const n = Number(digits);
  let value = n;
  if (kind !== "count") {
    const h = Math.floor(n / 100);
    const m = n % 100;
    if (m >= 60) return null;
    if (kind === "clock" && h >= 24) return null;
    value = h * 60 + m;
  }
  return value >= min && value <= max ? value : null;
}

function focusNext(current: HTMLInputElement) {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input[data-digit-input]")
  );
  const next = inputs[inputs.indexOf(current) + 1];
  if (next) next.focus();
  else current.blur();
}

export function DigitInput({
  kind,
  value,
  onChange,
  label,
  unit,
  min = 0,
  max = Infinity,
}: {
  kind: Kind;
  value: number;
  onChange: (v: number) => void;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
}) {
  const maxDigits = kind === "count" ? 3 : 4;
  // null while not editing; the field then shows the formatted value.
  const [draft, setDraft] = useState<string | null>(null);

  const invalid =
    draft !== null && draft !== "" && parse(kind, draft, min, max) === null;

  function commit(digits: string) {
    const parsed = parse(kind, digits, min, max);
    if (parsed !== null) onChange(parsed);
    setDraft(null);
  }

  return (
    <label className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          data-digit-input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={maxDigits}
          // Focus starts empty so typing replaces the value outright;
          // the current value stays visible as the placeholder.
          value={draft ?? format(kind, value)}
          placeholder={toDigits(kind, value)}
          onFocus={() => setDraft("")}
          // Read the DOM value: after an auto-advance the closure still holds
          // the previous keystroke's draft.
          onBlur={(e) => draft !== null && commit(e.target.value.replace(/\D/g, ""))}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
            setDraft(digits);
            if (
              digits.length === maxDigits &&
              parse(kind, digits, min, max) !== null
            ) {
              commit(digits);
              focusNext(e.target);
            }
          }}
          className={`w-24 rounded-xl border bg-background px-3 py-1.5 text-right text-lg font-bold tabular-nums text-text outline-none placeholder:text-text-muted/40 focus:border-primary ${
            invalid ? "border-accent-red" : "border-transparent"
          }`}
        />
        {unit && <span className="text-xs text-text-muted">{unit}</span>}
      </span>
    </label>
  );
}
