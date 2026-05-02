import Link from "next/link";
import { getEffectiveToday } from "@/lib/date-utils";
import {
  getSleepRecordByDate,
  getDailyLogByDate,
  getRecentSleepRecords,
  getRecentDailyLogs,
  getSleepRecordCount,
} from "@/lib/db/queries";
import { StatCard } from "@/components/ui/stat-card";
import { DateNav } from "@/components/ui/date-nav";
import { SleepSummaryCard } from "@/components/log/sleep-summary-card";


export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = getEffectiveToday();
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  // 1ヶ月前の日付を計算（月末の溢れは前月末日に丸める）
  const [cy, cm, cd] = date.split("-").map(Number);
  const oneMonthAgoDate = new Date(cy, cm - 2, cd);
  // 日が変わった = 溢れた（例: 3/31 → 2/31 → 3/3）ので前月末日に丸める
  if (oneMonthAgoDate.getDate() !== cd) {
    oneMonthAgoDate.setDate(0);
  }
  const oneMonthAgoStr = `${oneMonthAgoDate.getFullYear()}-${String(oneMonthAgoDate.getMonth() + 1).padStart(2, "0")}-${String(oneMonthAgoDate.getDate()).padStart(2, "0")}`;

  const [daySleep, dayLog, recentSleep, recentLogs, totalCount, pastLog] =
    await Promise.all([
      getSleepRecordByDate(date),
      getDailyLogByDate(date),
      getRecentSleepRecords(7),
      getRecentDailyLogs(7),
      getSleepRecordCount(),
      getDailyLogByDate(oneMonthAgoStr),
    ]);

  if (totalCount === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sleep Well</h1>
        <p className="text-text-muted">パーソナル睡眠コーチ</p>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">
            まずは睡眠データをインポートしましょう
          </p>
          <Link
            href="/import"
            className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            CSVインポート
          </Link>
        </div>
      </div>
    );
  }

  // Week stats
  const avgDuration =
    recentSleep.length > 0
      ? Math.round(
          recentSleep.reduce((s, r) => s + (r.totalSleepMinutes ?? 0), 0) /
            recentSleep.length
        )
      : null;

  const avgFreshness =
    recentLogs.filter((l) => l.freshnessScore).length > 0
      ? +(
          recentLogs
            .filter((l) => l.freshnessScore)
            .reduce((s, l) => s + l.freshnessScore!, 0) /
          recentLogs.filter((l) => l.freshnessScore).length
        ).toFixed(1)
      : null;



  // Log status for selected date
  const hasMorningLog = dayLog?.freshnessScore != null;
  const stressSources = dayLog?.stressSources as Record<string, number> | null;
  const hasEveningLog = (stressSources && Object.values(stressSources).reduce((s, v) => s + v, 0) > 0) || dayLog?.alcohol || dayLog?.exercise || dayLog?.socializing || dayLog?.bathing || dayLog?.intenseFocus || dayLog?.reading || dayLog?.lateMeal;
  const dateQuery = `?date=${date}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sleep Well</h1>

      <DateNav date={date} today={today} />

      {/* This day's sleep */}
      <SleepSummaryCard record={daySleep} />

      {/* Week stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="週平均睡眠"
          value={
            avgDuration
              ? `${Math.floor(avgDuration / 60)}h${avgDuration % 60}m`
              : "--"
          }
        />
        <StatCard
          label="すっきり度"
          value={avgFreshness ? `${avgFreshness}` : "--"}
          sub="/ 5"
        />
      </div>

      {/* Log status */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-text-muted">この日のログ</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/log/morning${dateQuery}`}
            className="flex items-center justify-center rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-hover"
          >
            <span
              className={`text-sm ${hasMorningLog ? "text-accent-green" : "text-text-muted"}`}
            >
              朝 {hasMorningLog ? "済み" : "未記入"}
            </span>
          </Link>
          <Link
            href={`/log/evening${dateQuery}`}
            className="flex items-center justify-center rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-hover"
          >
            <span
              className={`text-sm ${hasEveningLog ? "text-accent-green" : "text-text-muted"}`}
            >
              夜 {hasEveningLog ? "済み" : "未記入"}
            </span>
          </Link>
        </div>
      </div>

      {/* 1ヶ月前の日記 */}
      {pastLog?.note && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-xs font-medium text-text-muted">
            1ヶ月前の今日（{parseInt(oneMonthAgoStr.split("-")[1])}月{parseInt(oneMonthAgoStr.split("-")[2])}日）
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {pastLog.note}
          </p>
        </div>
      )}
    </div>
  );
}
