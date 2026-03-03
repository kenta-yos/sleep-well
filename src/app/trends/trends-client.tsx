"use client";

import { useState, useMemo } from "react";
import { PeriodSelector } from "@/components/ui/period-selector";
import { SleepDurationChart } from "@/components/charts/sleep-duration-chart";
import { BedtimeChart } from "@/components/charts/bedtime-chart";
import { CorrelationChart } from "@/components/charts/correlation-chart";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

export function TrendsClient({
  sleepRecords,
  dailyLogs,
}: {
  sleepRecords: SleepRecord[];
  dailyLogs: DailyLog[];
}) {
  const [days, setDays] = useState(30);

  const filteredSleep = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return sleepRecords.filter((r) => r.date >= cutoffStr);
  }, [sleepRecords, days]);

  const filteredLogs = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return dailyLogs.filter((l) => l.date >= cutoffStr);
  }, [dailyLogs, days]);

  // Build log map for freshness
  const logMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    for (const log of filteredLogs) {
      map.set(log.date, log);
    }
    return map;
  }, [filteredLogs]);

  const durationData = filteredSleep.map((r) => ({
    date: r.date,
    deep: r.deepMinutes ?? 0,
    light: r.lightMinutes ?? 0,
    rem: r.remMinutes ?? 0,
    freshness: logMap.get(r.date)?.freshnessScore ?? undefined,
  }));

  const bedtimeData = filteredSleep.map((r) => ({
    date: r.date,
    bedtime: r.bedtime as string | null,
    wakeTime: r.wakeTime as string | null,
  }));

  return (
    <div className="space-y-6">
      <PeriodSelector value={days} onChange={setDays} />

      <SleepDurationChart data={durationData} />
      <BedtimeChart data={bedtimeData} />
      <CorrelationChart sleepRecords={filteredSleep} logs={filteredLogs} />
    </div>
  );
}
