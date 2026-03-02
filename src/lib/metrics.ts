import type { SleepRecord } from "@/lib/db/schema";

export function calcBedrimeDeviation(
  records: SleepRecord[]
): number | null {
  const bedtimeMinutes = records
    .filter((r) => r.bedtime)
    .map((r) => {
      const d = new Date(r.bedtime as unknown as string);
      let h = d.getUTCHours() + 9;
      if (h >= 24) h -= 24;
      if (h < 12) h += 24;
      return h * 60 + d.getUTCMinutes();
    });

  if (bedtimeMinutes.length < 3) return null;

  const avg =
    bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
  const latest = bedtimeMinutes[0];

  return Math.round(latest - avg);
}

export function calcAvgFreshness(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s != null);
  if (valid.length === 0) return null;
  return +(valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
}

export function calcAvgSleepDuration(records: SleepRecord[]): number | null {
  if (records.length === 0) return null;
  return Math.round(
    records.reduce((s, r) => s + (r.totalSleepMinutes ?? 0), 0) /
      records.length
  );
}
