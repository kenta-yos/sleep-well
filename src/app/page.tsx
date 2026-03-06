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
import { generateNightlyTips } from "@/lib/rules";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = getEffectiveToday();
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
        <Link
          href={`/log${dateQuery}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-hover"
        >
          <span
            className={`flex-1 text-center text-sm ${hasMorningLog ? "text-accent-green" : "text-text-muted"}`}
          >
            朝 {hasMorningLog ? "済み" : "未記入"}
          </span>
          <span className="text-border">|</span>
          <span
            className={`flex-1 text-center text-sm ${hasEveningLog ? "text-accent-green" : "text-text-muted"}`}
          >
            夜 {hasEveningLog ? "済み" : "未記入"}
          </span>
        </Link>
      </div>
    </div>
  );
}
