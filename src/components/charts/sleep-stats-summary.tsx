"use client";

import type { SleepRecord } from "@/lib/db/schema";

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}時間${m.toString().padStart(2, "0")}分`;
}

// Convert ISO timestamp to "minutes since 18:00" (night axis) so we can average bedtimes across midnight.
function toNightMinutes(iso: string): number {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  let h = jst.getUTCHours();
  const m = jst.getUTCMinutes();
  if (h < 18) h += 24;
  return (h - 18) * 60 + m;
}

function nightMinutesToTime(nm: number): string {
  const totalMin = nm + 18 * 60;
  const h = Math.floor(totalMin / 60) % 24;
  const m = Math.round(totalMin % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

// For wake time, convert to minutes-from-midnight (wake is always in morning)
function toMorningMinutes(iso: string): number {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.getUTCHours() * 60 + jst.getUTCMinutes();
}

function morningMinutesToTime(mm: number): string {
  const h = Math.floor(mm / 60) % 24;
  const m = Math.round(mm % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export function SleepStatsSummary({
  records,
}: {
  records: SleepRecord[];
}) {
  const withSleep = records.filter((r) => r.totalSleepMinutes && r.totalSleepMinutes > 0);
  const medSleep = median(withSleep.map((r) => r.totalSleepMinutes!));

  const withBedtime = records.filter((r) => r.bedtime);
  const medBedNM = median(
    withBedtime.map((r) => toNightMinutes(r.bedtime as unknown as string))
  );

  const withWake = records.filter((r) => r.wakeTime);
  const medWakeMM = median(
    withWake.map((r) => toMorningMinutes(r.wakeTime as unknown as string))
  );

  const items: { label: string; value: string; sub?: string }[] = [
    {
      label: "睡眠時間（中央値）",
      value: medSleep != null ? formatMin(medSleep) : "—",
      sub: medSleep != null ? `${withSleep.length}日` : undefined,
    },
    {
      label: "就寝時刻（中央値）",
      value: medBedNM != null ? nightMinutesToTime(medBedNM) : "—",
      sub: medBedNM != null ? `${withBedtime.length}日` : undefined,
    },
    {
      label: "起床時刻（中央値）",
      value: medWakeMM != null ? morningMinutesToTime(medWakeMM) : "—",
      sub: medWakeMM != null ? `${withWake.length}日` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-border bg-surface px-3 py-3"
        >
          <p className="text-[10px] text-text-muted">{it.label}</p>
          <p className="mt-1 text-base font-semibold text-text tabular-nums">
            {it.value}
          </p>
          {it.sub && (
            <p className="text-[10px] text-text-muted">{it.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
