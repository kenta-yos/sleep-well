"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function toMorningMinutes(iso: string): number {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.getUTCHours() * 60 + jst.getUTCMinutes();
}

function toNightMinutes(iso: string): number {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  let h = jst.getUTCHours();
  if (h < 18) h += 24;
  return (h - 18) * 60 + jst.getUTCMinutes();
}

function nightMinutesToTime(nm: number): string {
  const totalMin = nm + 18 * 60;
  const h = Math.floor(totalMin / 60) % 24;
  const m = Math.round(totalMin % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function morningMinutesToTime(mm: number): string {
  const h = Math.floor(mm / 60) % 24;
  const m = Math.round(mm % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h${m.toString().padStart(2, "0")}m`;
}

interface MonthData {
  label: string; // "1月", "2月", ...
  key: string; // "2026-01"
  sleepMedian: number | null;
  bedtimeMedian: number | null;
  wakeMedian: number | null;
  hrMedian: number | null;
  freshnessMedian: number | null;
  stressAvg: number | null;
  paBalance: number | null;
  days: number;
}

function diffArrow(curr: number | null, prev: number | null, higherIsBetter: boolean): { icon: string; cls: string } {
  if (curr == null || prev == null) return { icon: "", cls: "" };
  const d = curr - prev;
  if (Math.abs(d) < 0.5) return { icon: "→", cls: "text-text-muted" };
  const good = higherIsBetter ? d > 0 : d < 0;
  return {
    icon: d > 0 ? "↑" : "↓",
    cls: good ? "text-accent-green" : "text-accent-red",
  };
}

export function MonthlyOverview({
  sleepRecords,
  dailyLogs,
}: {
  sleepRecords: SleepRecord[];
  dailyLogs: DailyLog[];
}) {
  // Group by month
  const sleepByMonth = new Map<string, SleepRecord[]>();
  for (const r of sleepRecords) {
    const key = r.date.slice(0, 7);
    const arr = sleepByMonth.get(key) ?? [];
    arr.push(r);
    sleepByMonth.set(key, arr);
  }

  const logsByMonth = new Map<string, DailyLog[]>();
  for (const l of dailyLogs) {
    const key = l.date.slice(0, 7);
    const arr = logsByMonth.get(key) ?? [];
    arr.push(l);
    logsByMonth.set(key, arr);
  }

  const allMonths = new Set([...sleepByMonth.keys(), ...logsByMonth.keys()]);
  const sortedMonths = [...allMonths].sort();

  if (sortedMonths.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-surface">
        <p className="text-sm text-text-muted">長期トレンドには2ヶ月以上のデータが必要です</p>
      </div>
    );
  }

  const months: MonthData[] = sortedMonths.map((key) => {
    const sleep = sleepByMonth.get(key) ?? [];
    const logs = logsByMonth.get(key) ?? [];
    const m = parseInt(key.split("-")[1]);

    const sleepMins = sleep.filter((r) => r.totalSleepMinutes && r.totalSleepMinutes > 0).map((r) => r.totalSleepMinutes!);
    const hrs = sleep.filter((r) => r.avgHeartRate && r.avgHeartRate > 0).map((r) => r.avgHeartRate!);
    const bedtimes = sleep.filter((r) => r.bedtime).map((r) => toNightMinutes(r.bedtime as unknown as string));
    const wakes = sleep.filter((r) => r.wakeTime).map((r) => toMorningMinutes(r.wakeTime as unknown as string));
    const freshness = logs.filter((l) => l.freshnessScore != null).map((l) => l.freshnessScore!);
    const stressTotals = logs
      .filter((l) => l.stressSources)
      .map((l) => Object.values(l.stressSources as Record<string, number>).reduce((a, b) => a + b, 0));
    const balances = logs
      .filter((l) => l.panasPositive != null && l.panasNegative != null)
      .map((l) => (l.panasPositive ?? 0) - (l.panasNegative ?? 0));

    return {
      label: `${m}月`,
      key,
      sleepMedian: median(sleepMins),
      bedtimeMedian: median(bedtimes),
      wakeMedian: median(wakes),
      hrMedian: median(hrs),
      freshnessMedian: median(freshness),
      stressAvg: avg(stressTotals),
      paBalance: avg(balances),
      days: Math.max(sleep.length, logs.length),
    };
  });

  // Chart data for key metrics
  const chartData = months.map((m) => ({
    label: m.label,
    sleep: m.sleepMedian ? +(m.sleepMedian / 60).toFixed(1) : null,
    hr: m.hrMedian ? Math.round(m.hrMedian) : null,
    freshness: m.freshnessMedian ? +m.freshnessMedian.toFixed(1) : null,
    stress: m.stressAvg ? +m.stressAvg.toFixed(1) : null,
    balance: m.paBalance ? +m.paBalance.toFixed(1) : null,
  }));

  return (
    <div className="space-y-6">
      {/* Monthly cards */}
      <div className="space-y-3">
        {[...months].reverse().map((m, i, arr) => {
          const prev = arr[i + 1] ?? null;
          return (
            <div
              key={m.key}
              className="rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <div className="flex items-baseline justify-between mb-2">
                <h4 className="text-sm font-medium">{m.key.split("-")[0]}年{m.label}</h4>
                <span className="text-[10px] text-text-muted">{m.days}日</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Metric
                  label="睡眠"
                  value={m.sleepMedian ? formatMin(m.sleepMedian) : "—"}
                  diff={diffArrow(m.sleepMedian, prev?.sleepMedian ?? null, true)}
                />
                <Metric
                  label="就寝"
                  value={m.bedtimeMedian != null ? nightMinutesToTime(m.bedtimeMedian) : "—"}
                  diff={diffArrow(m.bedtimeMedian, prev?.bedtimeMedian ?? null, false)}
                />
                <Metric
                  label="起床"
                  value={m.wakeMedian != null ? morningMinutesToTime(m.wakeMedian) : "—"}
                  diff={diffArrow(m.wakeMedian, prev?.wakeMedian ?? null, false)}
                />
                <Metric
                  label="心拍"
                  value={m.hrMedian ? `${Math.round(m.hrMedian)}` : "—"}
                  diff={diffArrow(m.hrMedian, prev?.hrMedian ?? null, false)}
                />
                <Metric
                  label="すっきり"
                  value={m.freshnessMedian ? `${m.freshnessMedian.toFixed(1)}` : "—"}
                  diff={diffArrow(m.freshnessMedian, prev?.freshnessMedian ?? null, true)}
                />
                <Metric
                  label="ストレス"
                  value={m.stressAvg != null ? `${m.stressAvg.toFixed(1)}` : "—"}
                  diff={diffArrow(m.stressAvg, prev?.stressAvg ?? null, false)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend charts */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">月次トレンド</h3>

        <MiniChart
          title="睡眠時間（中央値）"
          data={chartData}
          dataKey="sleep"
          color="oklch(0.5 0.2 270)"
          unit="h"
        />
        <MiniChart
          title="平均心拍数（中央値）"
          data={chartData}
          dataKey="hr"
          color="oklch(0.65 0.2 25)"
          unit="bpm"
        />
        <MiniChart
          title="すっきり度（中央値）"
          data={chartData}
          dataKey="freshness"
          color="oklch(0.72 0.17 155)"
          unit="/5"
          domain={[1, 5]}
        />
        <MiniChart
          title="ストレス合計（平均）"
          data={chartData}
          dataKey="stress"
          color="oklch(0.65 0.18 300)"
          unit=""
        />
        {chartData.some((d) => d.balance != null) && (
          <MiniChart
            title="PA-NAバランス（平均）"
            data={chartData}
            dataKey="balance"
            color="oklch(0.72 0.17 155)"
            unit=""
          />
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  diff,
}: {
  label: string;
  value: string;
  diff: { icon: string; cls: string };
}) {
  return (
    <div>
      <p className="text-text-muted">{label}</p>
      <p className="text-sm font-semibold tabular-nums">
        {value}{" "}
        {diff.icon && (
          <span className={`text-[10px] ${diff.cls}`}>{diff.icon}</span>
        )}
      </p>
    </div>
  );
}

function MiniChart({
  title,
  data,
  dataKey,
  color,
  unit,
  domain,
}: {
  title: string;
  data: Record<string, unknown>[];
  dataKey: string;
  color: string;
  unit: string;
  domain?: [number, number];
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-text-muted">{title}</p>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -20, right: 5, top: 5, bottom: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888" }}
              domain={domain ?? ["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                return (
                  <div className="rounded-xl border border-border bg-[#1a1a2e] px-3 py-2 text-xs">
                    <p className="text-text-muted">{d.payload.label}</p>
                    <p style={{ color }} className="font-medium">
                      {d.value != null ? `${d.value}${unit}` : "—"}
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
