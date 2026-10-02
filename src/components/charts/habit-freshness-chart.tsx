"use client";

import { HABITS, HabitIcon, type HabitKey } from "@/components/log/habits";

interface Night {
  /** Habits logged on that day's night. */
  habits: Record<HabitKey, boolean> | null;
  /** すっきり度 the following morning. */
  nextFreshness: number | null;
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

/**
 * For each habit, the following morning's average すっきり度 on nights with
 * it versus nights without. A habit needs a few nights on each side before
 * the comparison means anything, so thin ones are shown but greyed.
 */
export function HabitFreshnessChart({ nights }: { nights: Night[] }) {
  const usable = nights.filter((n) => n.habits && n.nextFreshness != null);

  const rows = HABITS.map((h) => {
    const withIt = usable.filter((n) => n.habits![h.key]).map((n) => n.nextFreshness!);
    const without = usable.filter((n) => !n.habits![h.key]).map((n) => n.nextFreshness!);
    return { ...h, withAvg: mean(withIt), withoutAvg: mean(without), n: withIt.length, m: without.length };
  }).filter((r) => r.n > 0);

  if (rows.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-bold">習慣と、翌朝のすっきり度</h3>
        <p className="text-xs text-text-muted">この期間は比べられる記録がまだありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">習慣と、翌朝のすっきり度</h3>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const thin = r.n < 3 || r.m < 3;
          const diff = r.withAvg != null && r.withoutAvg != null ? r.withAvg - r.withoutAvg : null;
          return (
            <div key={r.key} className={`flex items-center gap-2.5 ${thin ? "opacity-50" : ""}`}>
              <HabitIcon path={r.icon} className="h-4 w-4 shrink-0 text-text-muted" />
              <span className="w-8 shrink-0 text-[13px]">{r.label}</span>
              <span className="relative h-2 flex-1 rounded-full bg-background">
                {/* 1..5 mapped onto the track; the tick marks the nights without. */}
                {r.withAvg != null && (
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${diff != null && diff < 0 ? "bg-coral" : "bg-accent-green"}`}
                    style={{ width: `${((r.withAvg - 1) / 4) * 100}%` }}
                  />
                )}
                {r.withoutAvg != null && (
                  <span
                    className="absolute -inset-y-1 w-0.5 rounded bg-text"
                    style={{ left: `${((r.withoutAvg - 1) / 4) * 100}%` }}
                  />
                )}
              </span>
              <span className="w-[72px] shrink-0 text-right text-xs tabular-nums text-text-muted">
                {r.withAvg?.toFixed(1)} / {r.withoutAvg?.toFixed(1) ?? "—"}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-text-muted">
        棒＝その習慣をした夜の翌朝の平均、縦線＝しなかった夜の平均（すっきり度 1〜5）。
        どちらかが3晩未満の習慣は薄く表示しています。
      </p>
    </div>
  );
}
