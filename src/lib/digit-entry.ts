// "duration" and "clock" values are minutes, typed as HHMM (7h50m → 0750).
// "count" is a plain integer such as heart rate.
export type DigitKind = "duration" | "clock" | "count";

export function maxDigitsFor(kind: DigitKind) {
  return kind === "count" ? 3 : 4;
}

export function toDigits(kind: DigitKind, value: number) {
  if (kind === "count") return String(value);
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}`;
}

export function formatDigitValue(kind: DigitKind, value: number) {
  if (kind === "count") return `${value} bpm`;
  const h = Math.floor(value / 60);
  const m = value % 60;
  if (kind === "clock") {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return `${h}時間${m}分`;
}

/** Digits are read right-aligned, so "45" is 0:45 and "750" is 7:50. */
export function parseDigits(
  kind: DigitKind,
  digits: string,
  min: number,
  max: number
) {
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
