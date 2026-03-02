"use client";

import type { SleepRecord, DailyLog } from "@/lib/db/schema";

interface CorrelationResult {
  label: string;
  withHabit: { avg: number; count: number };
  withoutHabit: { avg: number; count: number };
}

function calcCorrelation(
  sleepRecords: SleepRecord[],
  logs: DailyLog[],
  habitKey: "lateScreen" | "alcohol" | "exercise"
): CorrelationResult | null {
  // Match logs with next-day freshness
  const logMap = new Map(logs.map((l) => [l.date, l]));

  const withHabitScores: number[] = [];
  const withoutHabitScores: number[] = [];

  for (const log of logs) {
    if (log.freshnessScore == null) continue;
    // Get the previous evening log (same date or previous date)
    const prevDate = new Date(log.date + "T00:00:00+09:00");
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split("T")[0];
    const prevLog = logMap.get(prevDateStr);

    if (!prevLog) continue;

    if (prevLog[habitKey]) {
      withHabitScores.push(log.freshnessScore);
    } else {
      withoutHabitScores.push(log.freshnessScore);
    }
  }

  if (withHabitScores.length < 3 || withoutHabitScores.length < 3) return null;

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    label:
      habitKey === "lateScreen"
        ? "スマホ遅い"
        : habitKey === "alcohol"
          ? "飲酒"
          : "運動",
    withHabit: { avg: +avg(withHabitScores).toFixed(2), count: withHabitScores.length },
    withoutHabit: {
      avg: +avg(withoutHabitScores).toFixed(2),
      count: withoutHabitScores.length,
    },
  };
}

export function CorrelationChart({
  sleepRecords,
  logs,
}: {
  sleepRecords: SleepRecord[];
  logs: DailyLog[];
}) {
  const habits = ["lateScreen", "alcohol", "exercise"] as const;
  const results = habits
    .map((h) => calcCorrelation(sleepRecords, logs, h))
    .filter((r): r is CorrelationResult => r !== null);

  if (results.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">生活習慣 × すっきり度</h3>
        <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="px-4 text-center text-sm text-text-muted">
            相関分析にはもう少しデータが必要です（各習慣3日以上）
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">生活習慣 × すっきり度</h3>
      <div className="space-y-3">
        {results.map((r) => (
          <div
            key={r.label}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <p className="mb-2 text-sm font-medium">{r.label}</p>
            <div className="flex gap-4">
              <CorrelationBar
                label="あり"
                avg={r.withHabit.avg}
                count={r.withHabit.count}
              />
              <CorrelationBar
                label="なし"
                avg={r.withoutHabit.avg}
                count={r.withoutHabit.count}
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              差: {(r.withHabit.avg - r.withoutHabit.avg).toFixed(2)}
              {r.withHabit.avg < r.withoutHabit.avg
                ? " (ありの方がすっきり度が低い)"
                : r.withHabit.avg > r.withoutHabit.avg
                  ? " (ありの方がすっきり度が高い)"
                  : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CorrelationBar({
  label,
  avg,
  count,
}: {
  label: string;
  avg: number;
  count: number;
}) {
  const pct = (avg / 5) * 100;
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-sm font-bold">{avg.toFixed(1)}</span>
      </div>
      <div className="h-3 rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-0.5 text-[10px] text-text-muted">{count}日</p>
    </div>
  );
}
