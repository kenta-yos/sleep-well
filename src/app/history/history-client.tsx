"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

const freshnessEmojis: Record<number, string> = {
  1: "😫",
  2: "😔",
  3: "😐",
  4: "😊",
  5: "😴",
};

function getStressTotal(sources: Record<string, number> | null | undefined): number {
  if (!sources || typeof sources !== "object") return 0;
  return Object.values(sources).reduce((sum, v) => sum + v, 0);
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+09:00");
  return d.toLocaleDateString("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" });
}

function addDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

interface Props {
  year: number;
  month: number;
  today: string;
  sleepRecords: SleepRecord[];
  dailyLogs: DailyLog[];
}

export function HistoryClient({ year, month, today, sleepRecords, dailyLogs }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const logMap = new Map(dailyLogs.map((l) => [l.date, l]));
  const sleepMap = new Map(sleepRecords.map((s) => [s.date, s]));

  const daysInMonth = getDaysInMonth(year, month);
  const pad = (n: number) => String(n).padStart(2, "0");

  // Build rows: each "night" from day 1..last day, newest first
  const rows: {
    nightDate: string;
    dayNum: number;
    dow: string;
    eveningLog: DailyLog | undefined;
    morningLog: DailyLog | undefined;
    sleep: SleepRecord | undefined;
  }[] = [];

  for (let d = daysInMonth; d >= 1; d--) {
    const nightDate = `${year}-${pad(month)}-${pad(d)}`;
    const nextDate = addDay(nightDate);
    rows.push({
      nightDate,
      dayNum: d,
      dow: getDayOfWeek(nightDate),
      eveningLog: logMap.get(nightDate),
      morningLog: logMap.get(nextDate),
      sleep: sleepMap.get(nextDate),
    });
  }

  // Don't show future dates
  const filteredRows = rows.filter((r) => r.nightDate <= today);

  const [todayY, todayM] = today.split("-").map(Number);
  const isCurrentMonth = year === todayY && month === todayM;

  function navigateMonth(delta: number) {
    const { year: ny, month: nm } = shiftMonth(year, month, delta);
    startTransition(() => {
      router.push(`/log?month=${ny}-${pad(nm)}`);
    });
  }

  function goToLog(date: string) {
    router.push(`/log?date=${date}`);
  }

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          disabled={isPending}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          {isPending ? (
            <Spinner className="text-primary" />
          ) : (
            <p className="text-lg font-bold">{year}年{month}月</p>
          )}
        </div>

        <button
          onClick={() => navigateMonth(1)}
          disabled={isCurrentMonth || isPending}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface disabled:opacity-30"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <p className="text-center text-[11px] text-text-muted">
        夜ログ + 翌朝ログ のペア表示
      </p>

      {/* List */}
      <div className="space-y-2">
        {filteredRows.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">
            データがありません
          </p>
        )}

        {filteredRows.map((row) => {
          const ev = row.eveningLog;
          const mo = row.morningLog;
          const sl = row.sleep;

          const stressTotal = getStressTotal(ev?.stressSources as Record<string, number> | null);
          const hasEvening = ev && (stressTotal > 0 || ev.alcohol || ev.exercise || ev.socializing || ev.bathing || ev.intenseFocus || ev.reading || ev.lateMeal);
          const hasMorning = mo?.freshnessScore != null;
          const hasSleep = sl?.totalSleepMinutes != null;
          const hasAny = hasEvening || hasMorning || hasSleep;

          return (
            <button
              key={row.nightDate}
              onClick={() => goToLog(row.nightDate)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                hasAny
                  ? "border-border bg-surface hover:border-primary/40"
                  : "border-border/50 bg-surface/50 hover:border-border"
              }`}
            >
              {/* Date header */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">
                  {month}/{row.dayNum}
                </span>
                <span className="text-xs text-text-muted">({row.dow})</span>
                <span className="text-[10px] text-text-muted">夜→朝</span>
              </div>

              {!hasAny ? (
                <p className="mt-1 text-xs text-text-muted">--</p>
              ) : (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {/* Evening: stress total */}
                  <span className="text-xs">
                    {stressTotal > 0 ? (
                      <>
                        {"😟 "}
                        <span className="text-text-muted">{stressTotal}</span>
                      </>
                    ) : (
                      <span className="text-text-muted">--</span>
                    )}
                  </span>

                  {/* Evening: habits */}
                  <span className="text-xs">
                    {ev?.exercise && "🏃"}
                    {ev?.alcohol && "🍺"}
                    {ev?.socializing && "👥"}
                    {ev?.bathing && "🛁"}
                    {ev?.intenseFocus && "💻"}
                    {ev?.reading && "📖"}
                    {ev?.lateMeal && "🍔"}
                    {!ev?.exercise && !ev?.alcohol && !ev?.socializing && !ev?.bathing && !ev?.intenseFocus && !ev?.reading && !ev?.lateMeal && (
                      <span className="text-text-muted">--</span>
                    )}
                  </span>

                  <span className="text-text-muted">|</span>

                  {/* Morning: freshness */}
                  <span className="text-xs">
                    {mo?.freshnessScore != null ? (
                      <>
                        {freshnessEmojis[mo.freshnessScore]}{" "}
                        <span className="text-text-muted">{mo.freshnessScore}</span>
                      </>
                    ) : (
                      <span className="text-text-muted">--</span>
                    )}
                  </span>

                  {/* Sleep duration */}
                  <span className="text-xs">
                    {sl?.totalSleepMinutes != null ? (
                      formatMinutes(sl.totalSleepMinutes)
                    ) : (
                      <span className="text-text-muted">--</span>
                    )}
                  </span>

                </div>
              )}

              {/* Note */}
              {ev?.note && (
                <p className="mt-1.5 text-[11px] text-text-muted">
                  {ev.note}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
