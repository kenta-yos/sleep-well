"use client";

import { useMemo } from "react";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

/* ── Spearman rank correlation ─────────────────────────────── */

interface CorrelationResult {
  label: string;
  rho: number;
  pValue: number;
  n: number;
  interpretation: string;
}

function rank(arr: number[]): number[] {
  const n = arr.length;
  const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && sorted[j + 1].v === sorted[j].v) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[sorted[k].i] = avgRank;
    i = j + 1;
  }
  return ranks;
}

function normalCDF(x: number): number {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function spearman(
  x: number[],
  y: number[]
): { rho: number; pValue: number; n: number } {
  const n = x.length;
  if (n < 5) return { rho: 0, pValue: 1, n };

  const rx = rank(x);
  const ry = rank(y);
  const meanRx = rx.reduce((a, b) => a + b) / n;
  const meanRy = ry.reduce((a, b) => a + b) / n;

  let num = 0,
    denX = 0,
    denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanRx;
    const dy = ry[i] - meanRy;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const rho = denX === 0 || denY === 0 ? 0 : num / Math.sqrt(denX * denY);
  const absT =
    rho === 1 || rho === -1
      ? Infinity
      : Math.abs(rho * Math.sqrt((n - 2) / (1 - rho * rho)));
  const pValue = absT === Infinity ? 0 : 2 * (1 - normalCDF(absT));

  return { rho: +rho.toFixed(3), pValue: +pValue.toFixed(4), n };
}

/* ── Helpers ───────────────────────────────────────────────── */

function bedtimeToMinutes(iso: string): number {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  let mins = jst.getHours() * 60 + jst.getMinutes();
  if (mins < 12 * 60) mins += 24 * 60; // after midnight
  return mins;
}

function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.round(mins % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function interpret(rho: number, pValue: number, n: number): string {
  if (n < 10) return "データ不足";
  if (pValue >= 0.1) return "有意な相関なし";
  const strength = Math.abs(rho) >= 0.5 ? "強い" : "弱い";
  const dir = rho > 0 ? "正" : "負";
  return `${strength}${dir}の相関`;
}

function sigLabel(pValue: number, n: number): string {
  if (n < 10) return "";
  if (pValue < 0.01) return "p<.01";
  if (pValue < 0.05) return "p<.05";
  if (pValue < 0.1) return "p<.10";
  return "n.s.";
}

/* ── Component ─────────────────────────────────────────────── */

export function CorrelationChart({
  sleepRecords,
  logs,
}: {
  sleepRecords: SleepRecord[];
  logs: DailyLog[];
}) {
  const results = useMemo(() => {
    const logMap = new Map(logs.map((l) => [l.date, l]));

    // Pair sleep record with same-date freshness & previous-day stress
    const pairs: {
      freshness: number;
      totalSleep: number;
      deep: number;
      light: number;
      rem: number;
      deepPct: number;
      remPct: number;
      bedtime: number;
      wakeTime: number;
      heartRate: number | null;
      stressTotal: number;
    }[] = [];

    for (const sr of sleepRecords) {
      const log = logMap.get(sr.date);
      if (!log?.freshnessScore || !sr.totalSleepMinutes) continue;

      // Previous day's stress
      const prev = new Date(sr.date + "T00:00:00+09:00");
      prev.setDate(prev.getDate() - 1);
      const prevStr = prev.toISOString().split("T")[0];
      const prevLog = logMap.get(prevStr);
      const stressTotal = prevLog?.stressSources
        ? Object.values(
            prevLog.stressSources as Record<string, number>
          ).reduce((a, b) => a + b, 0)
        : 0;

      pairs.push({
        freshness: log.freshnessScore,
        totalSleep: sr.totalSleepMinutes,
        deep: sr.deepMinutes ?? 0,
        light: sr.lightMinutes ?? 0,
        rem: sr.remMinutes ?? 0,
        deepPct: sr.deepMinutes
          ? (sr.deepMinutes / sr.totalSleepMinutes) * 100
          : 0,
        remPct: sr.remMinutes
          ? (sr.remMinutes / sr.totalSleepMinutes) * 100
          : 0,
        bedtime: sr.bedtime
          ? bedtimeToMinutes(sr.bedtime as unknown as string)
          : 0,
        wakeTime: sr.wakeTime
          ? bedtimeToMinutes(sr.wakeTime as unknown as string)
          : 0,
        heartRate: sr.avgHeartRate ?? null,
        stressTotal,
      });
    }

    if (pairs.length < 5) return null;

    const freshness = pairs.map((p) => p.freshness);

    const variables: {
      label: string;
      values: number[];
      unit: string;
    }[] = [
      {
        label: "睡眠時間",
        values: pairs.map((p) => p.totalSleep),
        unit: "分",
      },
      {
        label: "深い睡眠",
        values: pairs.map((p) => p.deep),
        unit: "分",
      },
      {
        label: "REM睡眠",
        values: pairs.map((p) => p.rem),
        unit: "分",
      },
      {
        label: "浅い睡眠",
        values: pairs.map((p) => p.light),
        unit: "分",
      },
      {
        label: "深い睡眠 %",
        values: pairs.map((p) => p.deepPct),
        unit: "%",
      },
      {
        label: "REM %",
        values: pairs.map((p) => p.remPct),
        unit: "%",
      },
      {
        label: "就寝時刻",
        values: pairs.map((p) => p.bedtime),
        unit: "time",
      },
      {
        label: "起床時刻",
        values: pairs.map((p) => p.wakeTime),
        unit: "time",
      },
      {
        label: "平均心拍",
        values: pairs.map((p) => p.heartRate ?? NaN),
        unit: "bpm",
      },
      {
        label: "前夜ストレス",
        values: pairs.map((p) => p.stressTotal),
        unit: "pt",
      },
    ];

    // Also compute per-freshness-level means for the breakdown table
    const freshLevels = [1, 2, 3, 4, 5].filter((f) =>
      pairs.some((p) => p.freshness === f)
    );
    const byLevel = freshLevels.map((f) => {
      const subset = pairs.filter((p) => p.freshness === f);
      const avg = (arr: number[]) =>
        arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
      return {
        level: f,
        n: subset.length,
        totalSleep: Math.round(avg(subset.map((s) => s.totalSleep))),
        deep: Math.round(avg(subset.map((s) => s.deep))),
        rem: Math.round(avg(subset.map((s) => s.rem))),
        light: Math.round(avg(subset.map((s) => s.light))),
        deepPct: +avg(subset.map((s) => s.deepPct)).toFixed(1),
        remPct: +avg(subset.map((s) => s.remPct)).toFixed(1),
        bedtime: avg(subset.map((s) => s.bedtime)),
        wakeTime: avg(subset.map((s) => s.wakeTime)),
        heartRate: +avg(
          subset.filter((s) => s.heartRate != null).map((s) => s.heartRate!)
        ).toFixed(1),
        stress: +avg(subset.map((s) => s.stressTotal)).toFixed(1),
      };
    });

    const correlations: CorrelationResult[] = variables
      .map((v) => {
        const validIdx = v.values
          .map((val, i) => (val != null && !isNaN(val) ? i : -1))
          .filter((i) => i >= 0);
        const vx = validIdx.map((i) => v.values[i]);
        const vy = validIdx.map((i) => freshness[i]);
        const { rho, pValue, n } = spearman(vx, vy);
        return {
          label: v.label,
          rho,
          pValue,
          n,
          interpretation: interpret(rho, pValue, n),
        };
      })
      .sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho));

    return { correlations, byLevel, totalN: pairs.length };
  }, [sleepRecords, logs]);

  if (!results) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">統計分析</h3>
        <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="px-4 text-center text-sm text-text-muted">
            分析にはもう少しデータが必要です（5日以上）
          </p>
        </div>
      </div>
    );
  }

  const { correlations, byLevel, totalN } = results;

  return (
    <div className="space-y-4">
      {/* Correlation table */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          睡眠指標 × すっきり度{" "}
          <span className="font-normal text-text-muted">
            Spearman順位相関 (n={totalN})
          </span>
        </h3>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="divide-y divide-border">
            {correlations.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-3 px-4 py-3"
              >
                {/* Label */}
                <span className="w-28 shrink-0 text-sm">{c.label}</span>

                {/* Bar visualization */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="relative h-5 flex-1 rounded-full bg-background overflow-hidden">
                    {/* Center line */}
                    <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
                    {/* Correlation bar */}
                    <div
                      className={`absolute top-0.5 h-4 rounded-full transition-all ${
                        c.rho >= 0 ? "bg-accent" : "bg-danger"
                      }`}
                      style={{
                        left: c.rho >= 0 ? "50%" : `${50 + c.rho * 50}%`,
                        width: `${Math.abs(c.rho) * 50}%`,
                        opacity: c.pValue < 0.1 ? 1 : 0.35,
                      }}
                    />
                  </div>
                </div>

                {/* rho value */}
                <span
                  className={`w-14 text-right text-sm font-mono font-bold ${
                    c.pValue < 0.1 ? "" : "text-text-muted"
                  }`}
                >
                  {c.rho > 0 ? "+" : ""}
                  {c.rho.toFixed(2)}
                </span>

                {/* Significance */}
                <span
                  className={`w-12 text-right text-xs ${
                    c.pValue < 0.05
                      ? "font-bold text-accent"
                      : "text-text-muted"
                  }`}
                >
                  {sigLabel(c.pValue, c.n)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-text-muted px-1">
          rho: -1(負の相関)〜+1(正の相関) / n.s.=有意でない /
          p&lt;.05で統計的に有意
        </p>
      </div>

      {/* Breakdown by freshness level */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">すっきり度別の平均値</h3>
        <div className="rounded-2xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="px-3 py-2 text-left font-medium">すっきり</th>
                <th className="px-3 py-2 text-right font-medium">n</th>
                <th className="px-3 py-2 text-right font-medium">睡眠</th>
                <th className="px-3 py-2 text-right font-medium">深い</th>
                <th className="px-3 py-2 text-right font-medium">REM</th>
                <th className="px-3 py-2 text-right font-medium">就寝</th>
                <th className="px-3 py-2 text-right font-medium">心拍</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byLevel.map((row) => (
                <tr key={row.level}>
                  <td className="px-3 py-2 font-medium">
                    {"😫😕😐🙂😊"[row.level - 1]} {row.level}
                  </td>
                  <td className="px-3 py-2 text-right text-text-muted">
                    {row.n}日
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Math.floor(row.totalSleep / 60)}h{row.totalSleep % 60}m
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.deep}m
                    <span className="text-text-muted"> {row.deepPct}%</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.rem}m
                    <span className="text-text-muted"> {row.remPct}%</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtTime(row.bedtime)}
                  </td>
                  <td className="px-3 py-2 text-right">{row.heartRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
