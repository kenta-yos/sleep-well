"use client";

import { useMemo } from "react";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

type BehaviorKey =
  | "alcohol"
  | "exercise"
  | "socializing"
  | "bathing"
  | "intenseFocus"
  | "reading"
  | "lateMeal";

const behaviorLabels: Record<BehaviorKey, string> = {
  alcohol: "飲酒",
  exercise: "運動",
  socializing: "人との交流",
  bathing: "入浴",
  intenseFocus: "集中作業",
  reading: "読書",
  lateMeal: "遅い食事",
};

type Row = {
  date: string;
  sleep: SleepRecord | null;
  log: DailyLog | null;
};

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stressTotal(sources: Record<string, number> | null | undefined): number | null {
  if (!sources) return null;
  return Object.values(sources).reduce((sum, v) => sum + v, 0);
}

function formatMin(min: number | null): string {
  if (min == null) return "—";
  return `${Math.round(min)}分`;
}

function formatHour(min: number | null): string {
  if (min == null) return "—";
  return `${(min / 60).toFixed(1)}h`;
}

function formatScore(s: number | null, digits = 1): string {
  if (s == null) return "—";
  return s.toFixed(digits);
}

function diffIcon(a: number | null, b: number | null, higherIsBetter: boolean): string {
  if (a == null || b == null) return "";
  const delta = a - b;
  if (Math.abs(delta) < 0.01) return "→";
  const good = higherIsBetter ? delta > 0 : delta < 0;
  if (delta > 0) return good ? "↑" : "↑";
  return good ? "↓" : "↓";
}

function diffClass(a: number | null, b: number | null, higherIsBetter: boolean): string {
  if (a == null || b == null) return "text-text-muted";
  const delta = a - b;
  if (Math.abs(delta) < 0.01) return "text-text-muted";
  const good = higherIsBetter ? delta > 0 : delta < 0;
  return good ? "text-accent-green" : "text-accent-red";
}

function computeMetrics(rows: Row[]) {
  return {
    deep: median(
      rows
        .map((r) => r.sleep?.deepMinutes ?? null)
        .filter((v): v is number => v != null && v > 0)
    ),
    total: median(
      rows
        .map((r) => r.sleep?.totalSleepMinutes ?? null)
        .filter((v): v is number => v != null && v > 0)
    ),
    freshness: median(
      rows
        .map((r) => r.log?.freshnessScore ?? null)
        .filter((v): v is number => v != null)
    ),
  };
}

export function QualityFactors({
  sleepRecords,
  dailyLogs,
}: {
  sleepRecords: SleepRecord[];
  dailyLogs: DailyLog[];
}) {
  const rows = useMemo<Row[]>(() => {
    const logMap = new Map<string, DailyLog>();
    for (const l of dailyLogs) logMap.set(l.date, l);
    const sleepMap = new Map<string, SleepRecord>();
    for (const s of sleepRecords) sleepMap.set(s.date, s);
    const allDates = new Set<string>([...sleepMap.keys(), ...logMap.keys()]);
    return [...allDates].sort().map((date) => ({
      date,
      sleep: sleepMap.get(date) ?? null,
      log: logMap.get(date) ?? null,
    }));
  }, [sleepRecords, dailyLogs]);

  if (rows.length < 5) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">睡眠の質と要因</h3>
        <p className="text-xs text-text-muted">
          データが少ないため分析できません（5日以上必要）。
        </p>
      </div>
    );
  }

  // Behavior tags
  const behaviorKeys: BehaviorKey[] = [
    "alcohol",
    "exercise",
    "bathing",
    "socializing",
    "intenseFocus",
    "reading",
    "lateMeal",
  ];

  const behaviorResults = behaviorKeys
    .map((key) => {
      const withTag = rows.filter((r) => r.log?.[key] === true);
      const withoutTag = rows.filter((r) => r.log && r.log[key] !== true);
      if (withTag.length < 2 || withoutTag.length < 2) return null;
      return {
        key,
        label: behaviorLabels[key],
        onCount: withTag.length,
        offCount: withoutTag.length,
        on: computeMetrics(withTag),
        off: computeMetrics(withoutTag),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  // Stress buckets
  const rowsWithStress = rows
    .map((r) => ({ ...r, stress: stressTotal(r.log?.stressSources as Record<string, number> | null | undefined) }))
    .filter((r): r is Row & { stress: number } => r.stress != null);

  const stressBuckets = rowsWithStress.length >= 6
    ? [
        { label: "低 (0-3)", rows: rowsWithStress.filter((r) => r.stress <= 3) },
        { label: "中 (4-8)", rows: rowsWithStress.filter((r) => r.stress >= 4 && r.stress <= 8) },
        { label: "高 (9+)", rows: rowsWithStress.filter((r) => r.stress >= 9) },
      ].map((b) => ({ ...b, metrics: computeMetrics(b.rows) }))
    : null;

  // Heart rate quartile buckets
  const hrValues = rows
    .map((r) => r.sleep?.avgHeartRate ?? null)
    .filter((v): v is number => v != null && v > 0)
    .sort((a, b) => a - b);

  let hrBuckets: { label: string; rows: Row[]; metrics: ReturnType<typeof computeMetrics> }[] | null = null;
  if (hrValues.length >= 9) {
    const q1 = hrValues[Math.floor(hrValues.length / 3)];
    const q2 = hrValues[Math.floor((hrValues.length * 2) / 3)];
    const hrRows = rows.filter((r) => (r.sleep?.avgHeartRate ?? 0) > 0);
    const lowRows = hrRows.filter((r) => (r.sleep?.avgHeartRate ?? 0) <= q1);
    const midRows = hrRows.filter((r) => {
      const hr = r.sleep?.avgHeartRate ?? 0;
      return hr > q1 && hr <= q2;
    });
    const highRows = hrRows.filter((r) => (r.sleep?.avgHeartRate ?? 0) > q2);
    hrBuckets = [
      { label: `低 (〜${q1})`, rows: lowRows, metrics: computeMetrics(lowRows) },
      { label: `中 (${q1 + 1}-${q2})`, rows: midRows, metrics: computeMetrics(midRows) },
      { label: `高 (${q2 + 1}〜)`, rows: highRows, metrics: computeMetrics(highRows) },
    ];
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">睡眠の質と要因</h3>
        <p className="text-[11px] text-text-muted">
          中央値で比較（N = 日数）。主観 = すっきり度 / 客観 = 深い眠り・総睡眠。
        </p>
      </div>

      {behaviorResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted">行動タグ（あり vs なし）</h4>
          <div className="space-y-2">
            {behaviorResults.map((b) => (
              <div
                key={b.key}
                className="rounded-2xl border border-border bg-surface px-3 py-3"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">{b.label}</span>
                  <span className="text-[10px] text-text-muted">
                    あり {b.onCount}日 / なし {b.offCount}日
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 text-[11px]">
                  <div className="text-text-muted" />
                  <div className="text-center text-text-muted">あり</div>
                  <div className="text-center text-text-muted">なし</div>
                  <div className="text-center text-text-muted">差</div>

                  <MetricRow
                    label="深い眠り"
                    on={b.on.deep}
                    off={b.off.deep}
                    format={formatMin}
                    higherIsBetter
                  />
                  <MetricRow
                    label="総睡眠"
                    on={b.on.total}
                    off={b.off.total}
                    format={formatHour}
                    higherIsBetter
                  />
                  <MetricRow
                    label="すっきり度"
                    on={b.on.freshness}
                    off={b.off.freshness}
                    format={(v) => formatScore(v, 1)}
                    higherIsBetter
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stressBuckets && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted">ストレス合計と睡眠</h4>
          <BucketTable
            headers={stressBuckets.map((b) => `${b.label}\n${b.rows.length}日`)}
            buckets={stressBuckets}
          />
        </div>
      )}

      {hrBuckets && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted">平均心拍数と睡眠</h4>
          <BucketTable
            headers={hrBuckets.map((b) => `${b.label}\n${b.rows.length}日`)}
            buckets={hrBuckets}
          />
        </div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  on,
  off,
  format,
  higherIsBetter,
}: {
  label: string;
  on: number | null;
  off: number | null;
  format: (v: number | null) => string;
  higherIsBetter: boolean;
}) {
  return (
    <>
      <div className="text-text-muted">{label}</div>
      <div className="text-center tabular-nums">{format(on)}</div>
      <div className="text-center tabular-nums">{format(off)}</div>
      <div
        className={`text-center tabular-nums ${diffClass(on, off, higherIsBetter)}`}
      >
        {diffIcon(on, off, higherIsBetter)}
      </div>
    </>
  );
}

function BucketTable({
  headers,
  buckets,
}: {
  headers: string[];
  buckets: { label: string; rows: Row[]; metrics: ReturnType<typeof computeMetrics> }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-3">
      <div
        className="grid gap-1 text-[11px]"
        style={{ gridTemplateColumns: `minmax(70px,auto) repeat(${buckets.length}, 1fr)` }}
      >
        <div />
        {headers.map((h, i) => (
          <div key={i} className="whitespace-pre-line text-center text-text-muted leading-tight">
            {h}
          </div>
        ))}

        <div className="text-text-muted">深い眠り</div>
        {buckets.map((b, i) => (
          <div key={i} className="text-center tabular-nums">
            {formatMin(b.metrics.deep)}
          </div>
        ))}

        <div className="text-text-muted">総睡眠</div>
        {buckets.map((b, i) => (
          <div key={i} className="text-center tabular-nums">
            {formatHour(b.metrics.total)}
          </div>
        ))}

        <div className="text-text-muted">すっきり度</div>
        {buckets.map((b, i) => (
          <div key={i} className="text-center tabular-nums">
            {formatScore(b.metrics.freshness, 1)}
          </div>
        ))}
      </div>
    </div>
  );
}
