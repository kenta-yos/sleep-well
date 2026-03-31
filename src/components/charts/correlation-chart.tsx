"use client";

import { useMemo } from "react";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

/* ── Spearman rank correlation ─────────────────────────────── */

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
  if (mins < 12 * 60) mins += 24 * 60;
  return mins;
}

function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.round(mins % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

interface Variable {
  question: string;
  moreLabel: string;
  lessLabel: string;
  values: number[];
}

interface Result {
  question: string;
  rho: number;
  pValue: number;
  n: number;
  verdict: string;
  confidence: "significant" | "trend" | "none" | "insufficient";
}

function getVerdict(
  rho: number,
  pValue: number,
  n: number,
  moreLabel: string,
  lessLabel: string
): { verdict: string; confidence: Result["confidence"] } {
  if (n < 10)
    return { verdict: "まだデータが少ないです", confidence: "insufficient" };

  const dir = rho > 0 ? moreLabel : lessLabel;

  if (pValue < 0.05) {
    return {
      verdict: `${dir}傾向あり`,
      confidence: "significant",
    };
  }
  if (pValue < 0.1) {
    return {
      verdict: `やや${dir}かも？`,
      confidence: "trend",
    };
  }
  return {
    verdict: "今のところ関連なし",
    confidence: "none",
  };
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

    const pairs: {
      freshness: number;
      totalSleep: number;
      deep: number;
      rem: number;
      bedtime: number;
      wakeTime: number;
      heartRate: number | null;
      stressTotal: number;
    }[] = [];

    for (const sr of sleepRecords) {
      const log = logMap.get(sr.date);
      if (!log?.freshnessScore || !sr.totalSleepMinutes) continue;

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
        rem: sr.remMinutes ?? 0,
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

    const variables: Variable[] = [
      {
        question: "長く寝るほどすっきり？",
        moreLabel: "長いほどすっきり",
        lessLabel: "短いほどすっきり",
        values: pairs.map((p) => p.totalSleep),
      },
      {
        question: "深い睡眠が多いほどすっきり？",
        moreLabel: "多いほどすっきり",
        lessLabel: "少ないほどすっきり",
        values: pairs.map((p) => p.deep),
      },
      {
        question: "REM睡眠が多いほどすっきり？",
        moreLabel: "多いほどすっきり",
        lessLabel: "少ないほどすっきり",
        values: pairs.map((p) => p.rem),
      },
      {
        question: "早く寝るほどすっきり？",
        moreLabel: "遅いほどすっきり",
        lessLabel: "早いほどすっきり",
        values: pairs.map((p) => p.bedtime),
      },
      {
        question: "早く起きるほどすっきり？",
        moreLabel: "遅いほどすっきり",
        lessLabel: "早いほどすっきり",
        values: pairs.map((p) => p.wakeTime),
      },
      {
        question: "心拍が低いほどすっきり？",
        moreLabel: "高いほどすっきり",
        lessLabel: "低いほどすっきり",
        values: pairs.map((p) => p.heartRate ?? NaN),
      },
      {
        question: "ストレスが低いほどすっきり？",
        moreLabel: "高いほどすっきり",
        lessLabel: "低いほどすっきり",
        values: pairs.map((p) => p.stressTotal),
      },
    ];

    const analyzed: Result[] = variables.map((v) => {
      const validIdx = v.values
        .map((val, i) => (val != null && !isNaN(val) ? i : -1))
        .filter((i) => i >= 0);
      const vx = validIdx.map((i) => v.values[i]);
      const vy = validIdx.map((i) => freshness[i]);
      const { rho, pValue, n } = spearman(vx, vy);
      const { verdict, confidence } = getVerdict(
        rho,
        pValue,
        n,
        v.moreLabel,
        v.lessLabel
      );
      return { question: v.question, rho, pValue, n, verdict, confidence };
    });

    // Per-freshness-level means for breakdown table
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
        bedtime: avg(subset.map((s) => s.bedtime)),
        heartRate: +avg(
          subset.filter((s) => s.heartRate != null).map((s) => s.heartRate!)
        ).toFixed(1),
        stress: +avg(subset.map((s) => s.stressTotal)).toFixed(1),
      };
    });

    return { analyzed, byLevel, totalN: pairs.length };
  }, [sleepRecords, logs]);

  if (!results) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">すっきり度の分析</h3>
        <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="px-4 text-center text-sm text-text-muted">
            分析にはもう少しデータが必要です（5日以上）
          </p>
        </div>
      </div>
    );
  }

  const { analyzed, byLevel, totalN } = results;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          何がすっきり度に影響してる？
        </h3>
        <p className="text-xs text-text-muted">
          {totalN}日分のデータで統計分析した結果
        </p>

        <div className="space-y-2">
          {analyzed.map((r) => (
            <div
              key={r.question}
              className="rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <p className="text-sm font-medium mb-1.5">{r.question}</p>
              <div className="flex items-center gap-2">
                {/* Verdict badge */}
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.confidence === "significant"
                      ? "bg-accent/15 text-accent"
                      : r.confidence === "trend"
                        ? "bg-yellow-500/15 text-yellow-600"
                        : r.confidence === "insufficient"
                          ? "bg-gray-500/10 text-text-muted"
                          : "bg-gray-500/10 text-text-muted"
                  }`}
                >
                  {r.verdict}
                </span>

                {/* Strength indicator dots */}
                <div className="flex gap-0.5 ml-auto">
                  {[0.1, 0.3, 0.5].map((threshold, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${
                        Math.abs(r.rho) >= threshold && r.pValue < 0.1
                          ? "bg-accent"
                          : "bg-border"
                      }`}
                    />
                  ))}
                </div>

                {/* Stats detail (subtle) */}
                <span className="text-[10px] text-text-muted tabular-nums">
                  r={r.rho > 0 ? "+" : ""}
                  {r.rho.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-text-muted px-1 leading-relaxed">
          Spearman順位相関で分析。データが増えると精度が上がります。
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
                <th className="px-3 py-2 text-right font-medium">日数</th>
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
                    {["😫", "😕", "😐", "🙂", "😊"][row.level - 1]}{" "}
                    {row.level}
                  </td>
                  <td className="px-3 py-2 text-right text-text-muted">
                    {row.n}日
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Math.floor(row.totalSleep / 60)}h{row.totalSleep % 60}m
                  </td>
                  <td className="px-3 py-2 text-right">{row.deep}分</td>
                  <td className="px-3 py-2 text-right">{row.rem}分</td>
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
