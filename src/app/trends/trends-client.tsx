"use client";

import { useState, useMemo } from "react";
import { PeriodSelector } from "@/components/ui/period-selector";
import { SleepDurationChart } from "@/components/charts/sleep-duration-chart";
import { BedtimeChart } from "@/components/charts/bedtime-chart";
import { StressHeatmap } from "@/components/charts/stress-heatmap";
import { SleepStatsSummary } from "@/components/charts/sleep-stats-summary";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

/** Generate all YYYY-MM-DD strings from startDate to endDate inclusive */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function getTodayLocal(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split("T")[0];
}

function getDaysAgo(days: number): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jst.setDate(jst.getDate() - days);
  return jst.toISOString().split("T")[0];
}

export function TrendsClient({
  sleepRecords,
  dailyLogs,
}: {
  sleepRecords: SleepRecord[];
  dailyLogs: DailyLog[];
}) {
  const [days, setDays] = useState(30);

  const sleepMap = useMemo(() => {
    const map = new Map<string, SleepRecord>();
    for (const r of sleepRecords) map.set(r.date, r);
    return map;
  }, [sleepRecords]);

  const logMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    for (const l of dailyLogs) map.set(l.date, l);
    return map;
  }, [dailyLogs]);

  const dateRange = useMemo(
    () => generateDateRange(getDaysAgo(days), getTodayLocal()),
    [days]
  );

  const durationData = dateRange.map((date) => {
    const r = sleepMap.get(date);
    return {
      date,
      deep: r?.deepMinutes ?? 0,
      light: r?.lightMinutes ?? 0,
      rem: r?.remMinutes ?? 0,
      totalMinutes: r?.totalSleepMinutes ?? 0,
      freshness: logMap.get(date)?.freshnessScore ?? undefined,
    };
  });

  const bedtimeData = dateRange.map((date) => {
    const r = sleepMap.get(date);
    return {
      date,
      bedtime: (r?.bedtime as string | null) ?? null,
      wakeTime: (r?.wakeTime as string | null) ?? null,
    };
  });

  const stressData = dateRange.map((date) => {
    const l = logMap.get(date);
    return {
      date,
      stressSources: (l?.stressSources as Record<string, number> | null) ?? null,
    };
  });

  const filteredSleep = useMemo(() => {
    const cutoff = getDaysAgo(days);
    return sleepRecords.filter((r) => r.date >= cutoff);
  }, [sleepRecords, days]);

  return (
    <div className="space-y-6">
      <PeriodSelector value={days} onChange={setDays} />

      <SleepStatsSummary records={filteredSleep} />
      <SleepDurationChart data={durationData} />
      <BedtimeChart data={bedtimeData} />
      <StressHeatmap data={stressData} />
    </div>
  );
}
