import Link from "next/link";
import { getTodayJST } from "@/lib/date-utils";
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
import { generateNightlyTips } from "@/lib/rules";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = getTodayJST();
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const [daySleep, dayLog, recentSleep, recentLogs, totalCount] =
    await Promise.all([
      getSleepRecordByDate(date),
      getDailyLogByDate(date),
      getRecentSleepRecords(7),
      getRecentDailyLogs(7),
      getSleepRecordCount(),
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
  const avgScore =
    recentSleep.length > 0
      ? Math.round(
          recentSleep.reduce((s, r) => s + (r.sleepScore ?? 0), 0) /
            recentSleep.filter((r) => r.sleepScore).length
        )
      : null;

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

  const tips = generateNightlyTips(recentSleep, recentLogs);

  // Log status for selected date
  const hasMorningLog = dayLog?.freshnessScore != null;
  const hasEveningLog = dayLog?.stressScore != null;
  const dateQuery = date !== today ? `?date=${date}` : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sleep Well</h1>

      <DateNav date={date} today={today} />

      {/* This day's sleep */}
      <SleepSummaryCard record={daySleep} />

      {/* Week stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="週平均スコア"
          value={avgScore ? `${avgScore}` : "--"}
          sub="/ 100"
        />
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

      {/* Tonight's tips (only show for today) */}
      {date === today && tips.length > 0 && (
        <div className="rounded-2xl border border-accent-yellow/30 bg-accent-yellow/5 p-4">
          <h2 className="mb-2 text-sm font-medium text-accent-yellow">
            今夜のおすすめ
          </h2>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="text-sm text-text">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Log status */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-text-muted">この日のログ</h2>
        <div className="flex gap-3">
          <Link
            href={`/log/morning${dateQuery}`}
            className={`flex-1 rounded-xl border p-3 text-center text-sm transition-colors ${
              hasMorningLog
                ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
                : "border-border bg-surface text-text-muted hover:border-primary"
            }`}
          >
            {hasMorningLog ? "朝ログ済み" : "朝ログ未記入"}
          </Link>
          <Link
            href={`/log/evening${dateQuery}`}
            className={`flex-1 rounded-xl border p-3 text-center text-sm transition-colors ${
              hasEveningLog
                ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
                : "border-border bg-surface text-text-muted hover:border-primary"
            }`}
          >
            {hasEveningLog ? "夜ログ済み" : "夜ログ未記入"}
          </Link>
        </div>
      </div>
    </div>
  );
}
