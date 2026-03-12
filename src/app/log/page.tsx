import Link from "next/link";
import { getEffectiveToday, formatDateJP } from "@/lib/date-utils";
import {
  getSleepRecordByDate,
  getDailyLogByDate,
  getMonthlyData,
} from "@/lib/db/queries";
import { DateNav } from "@/components/ui/date-nav";
import { SleepSummaryCard } from "@/components/log/sleep-summary-card";
import { HistoryClient } from "../history/history-client";

const freshnessEmojis: Record<number, string> = {
  1: "😫",
  2: "😕",
  3: "😐",
  4: "😊",
  5: "😴",
};

const stressLabels: Record<string, string> = {
  work: "仕事",
  friends: "友人関係",
  romance: "恋愛",
  health: "体調・健康",
  money: "金銭",
  future: "将来・生き方",
  other: "その他",
};

const habitList = [
  { key: "exercise", icon: "🏃", label: "運動" },
  { key: "alcohol", icon: "🍺", label: "飲酒" },
  { key: "socializing", icon: "👥", label: "交流" },
  { key: "bathing", icon: "🛁", label: "入浴" },
  { key: "intenseFocus", icon: "💻", label: "集中" },
  { key: "reading", icon: "📖", label: "読書" },
  { key: "lateMeal", icon: "🍔", label: "遅食" },
] as const;

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const { date: dateParam, month: monthParam } = await searchParams;
  const today = getEffectiveToday();

  // If ?date= is present, show read-only summary
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return <LogSummaryView date={dateParam} today={today} />;
  }

  // Otherwise, show monthly history list
  let year: number;
  let month: number;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  } else {
    const [y, m] = today.split("-").map(Number);
    year = y;
    month = m;
  }

  const { sleep, logs } = await getMonthlyData(year, month);

  return (
    <HistoryClient
      year={year}
      month={month}
      today={today}
      sleepRecords={sleep}
      dailyLogs={logs}
    />
  );
}

async function LogSummaryView({
  date,
  today,
}: {
  date: string;
  today: string;
}) {
  const [sleepRecord, dailyLog] = await Promise.all([
    getSleepRecordByDate(date),
    getDailyLogByDate(date),
  ]);

  const dateQuery = `?date=${date}`;
  const freshnessScore = dailyLog?.freshnessScore ?? null;
  const stressSources = (dailyLog?.stressSources as Record<string, number>) ?? null;
  const stressTotal = stressSources
    ? Object.values(stressSources).reduce((s, v) => s + v, 0)
    : 0;
  const activeHabits = habitList.filter(
    (h) => dailyLog?.[h.key as keyof typeof dailyLog]
  );

  return (
    <div className="space-y-6">
      <DateNav date={date} today={today} />

      <Link
        href="/log"
        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        一覧に戻る
      </Link>

      <h1 className="text-lg font-bold">{formatDateJP(date)}のログ</h1>

      {/* Morning section */}
      <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">朝の記録</h2>
          <Link
            href={`/log/morning${dateQuery}`}
            className="text-xs text-primary hover:underline"
          >
            編集する &rarr;
          </Link>
        </div>

        {freshnessScore != null ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{freshnessEmojis[freshnessScore] ?? ""}</span>
            <span className="text-sm text-text">すっきり度 {freshnessScore}/5</span>
          </div>
        ) : (
          <p className="text-sm text-text-muted">未記入</p>
        )}

        <SleepSummaryCard record={sleepRecord} />
      </section>

      {/* Evening section */}
      <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">夜の記録</h2>
          <Link
            href={`/log/evening${dateQuery}`}
            className="text-xs text-primary hover:underline"
          >
            編集する &rarr;
          </Link>
        </div>

        {stressTotal > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-text">ストレス合計: {stressTotal}</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stressSources!)
                .filter(([, v]) => v > 0)
                .map(([key, val]) => (
                  <span
                    key={key}
                    className="rounded-full border border-accent-purple/40 bg-accent-purple/10 px-2 py-0.5 text-xs text-text"
                  >
                    {stressLabels[key] ?? key} {val}
                  </span>
                ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">ストレス: 記録なし</p>
        )}

        {activeHabits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeHabits.map((h) => (
              <span
                key={h.key}
                className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-text"
              >
                {h.icon} {h.label}
              </span>
            ))}
          </div>
        )}

        {dailyLog?.note ? (
          <p className="text-sm text-text whitespace-pre-wrap">{dailyLog.note}</p>
        ) : null}

        {!stressTotal && activeHabits.length === 0 && !dailyLog?.note && (
          <p className="text-sm text-text-muted">未記入</p>
        )}
      </section>
    </div>
  );
}
