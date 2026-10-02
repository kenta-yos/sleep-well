"use client";

import { useState, useMemo, type ReactNode } from "react";
import { SleepDurationChart } from "@/components/charts/sleep-duration-chart";
import { BedtimeChart } from "@/components/charts/bedtime-chart";
import { StressTrendChart } from "@/components/charts/stress-trend-chart";
import { SleepStatsSummary } from "@/components/charts/sleep-stats-summary";
import { HeartRateChart } from "@/components/charts/heart-rate-chart";
import { AffectChart } from "@/components/charts/affect-chart";
import { HabitFreshnessChart } from "@/components/charts/habit-freshness-chart";
import { MonthlyOverview } from "@/components/charts/monthly-overview";
import { HABITS, type HabitKey } from "@/components/log/habits";
import type { TrendsSleep, TrendsLog } from "@/lib/db/schema";

function jstDaysAgo(days: number): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  jst.setUTCDate(jst.getUTCDate() - days);
  return jst.toISOString().slice(0, 10);
}

function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  for (; d <= last; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

const PERIODS = [
  { id: "14", label: "2週間", days: 14 },
  { id: "30", label: "1ヶ月", days: 30 },
  { id: "90", label: "3ヶ月", days: 90 },
  { id: "year", label: "1年（月ごと）", days: null },
] as const;

type PeriodId = (typeof PERIODS)[number]["id"];

export function TrendsClient({
  sleepRecords,
  dailyLogs,
}: {
  sleepRecords: TrendsSleep[];
  dailyLogs: TrendsLog[];
}) {
  const [period, setPeriod] = useState<PeriodId>("14");
  const days = PERIODS.find((p) => p.id === period)!.days;

  const sleepMap = useMemo(() => new Map(sleepRecords.map((r) => [r.date, r])), [sleepRecords]);
  const logMap = useMemo(() => new Map(dailyLogs.map((l) => [l.date, l])), [dailyLogs]);

  const range = useMemo(
    () => (days ? dateRange(jstDaysAgo(days - 1), jstDaysAgo(0)) : []),
    [days]
  );

  const chips = (
    <div className="flex flex-wrap gap-1.5">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={period === p.id}
          onClick={() => setPeriod(p.id)}
          className={`min-h-[36px] rounded-full px-3.5 text-xs transition-colors ${
            period === p.id
              ? "border border-primary bg-primary-soft font-bold text-text"
              : "border border-border text-text-muted"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  if (!days) {
    return (
      <div className="space-y-4">
        {chips}
        <Card>
          <SleepStatsSummary records={sleepRecords} />
        </Card>
        <MonthlyOverview sleepRecords={sleepRecords} dailyLogs={dailyLogs} />
      </div>
    );
  }

  const inRange = (date: string) => date >= range[0];

  return (
    <div className="space-y-4">
      {chips}

      <Card>
        <SleepStatsSummary records={sleepRecords.filter((r) => inRange(r.date))} />
      </Card>

      <Card>
        <SleepDurationChart
          data={range.map((date) => {
            const r = sleepMap.get(date);
            return {
              date,
              deep: r?.deepMinutes ?? 0,
              light: r?.lightMinutes ?? 0,
              rem: r?.remMinutes ?? 0,
              totalMinutes: r?.totalSleepMinutes ?? 0,
              freshness: logMap.get(date)?.freshnessScore ?? undefined,
            };
          })}
        />
      </Card>

      <Card>
        <BedtimeChart
          data={range.map((date) => {
            const r = sleepMap.get(date);
            return { date, bedtime: r?.bedtime ?? null, wakeTime: r?.wakeTime ?? null };
          })}
        />
      </Card>

      <Card>
        <StressTrendChart
          data={range.map((date) => ({
            date,
            stressSources:
              (logMap.get(date)?.stressSources as Record<string, number> | null) ?? null,
          }))}
        />
      </Card>

      <Card>
        <AffectChart
          data={range.map((date) => {
            const l = logMap.get(date);
            return { date, vitality: l?.tdmsVitality ?? null, stability: l?.tdmsStability ?? null };
          })}
        />
      </Card>

      <Card>
        <HeartRateChart
          data={range.map((date) => {
            const r = sleepMap.get(date);
            return {
              date,
              avgHR: r?.avgHeartRate ?? null,
              minHR: r?.minHeartRate ?? null,
              maxHR: r?.maxHeartRate ?? null,
            };
          })}
        />
      </Card>

      <Card>
        <HabitFreshnessChart
          nights={range.map((date) => {
            const l = logMap.get(date);
            const next = new Date(`${date}T00:00:00Z`);
            next.setUTCDate(next.getUTCDate() + 1);
            const nextLog = logMap.get(next.toISOString().slice(0, 10));
            // A night counts once stress/habits were saved for it.
            const habits =
              l && l.stressSources != null
                ? (Object.fromEntries(HABITS.map((h) => [h.key, !!l[h.key]])) as Record<HabitKey, boolean>)
                : null;
            return { habits, nextFreshness: nextLog?.freshnessScore ?? null };
          })}
        />
      </Card>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-2xl bg-surface p-4">{children}</section>;
}
