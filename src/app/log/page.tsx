import Link from "next/link";
import { getEffectiveToday, formatDateJP } from "@/lib/date-utils";
import {
  getSleepRecordByDate,
  getDailyLogByDate,
  getMonthlyData,
} from "@/lib/db/queries";
import { SleepSummaryCard } from "@/components/log/sleep-summary-card";
import { DateNav } from "@/components/ui/date-nav";
import { MorningForm } from "./morning/morning-form";
import { EveningForm } from "./evening/evening-form";
import { HistoryClient } from "../history/history-client";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const { date: dateParam, month: monthParam } = await searchParams;
  const today = getEffectiveToday();

  // If ?date= is present, show edit form
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return <LogEditView date={dateParam} today={today} />;
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

async function LogEditView({
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

  return (
    <div className="space-y-8">
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

      {/* Morning section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">朝の記録</h2>
          <p className="text-xs text-text-muted">
            {formatDateJP(date)}の朝、起きたときのすっきり度
          </p>
        </div>

        <SleepSummaryCard record={sleepRecord} />

        <MorningForm
          key={`morning-${date}`}
          date={date}
          initialScore={dailyLog?.freshnessScore ?? null}
        />

        <Link
          href={`/log/morning${date !== today ? `?date=${date}` : ""}`}
          className="block text-center text-xs text-primary underline"
        >
          睡眠データも手入力する →
        </Link>
      </section>

      <hr className="border-border" />

      {/* Evening section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">夜の記録</h2>
          <p className="text-xs text-text-muted">
            {formatDateJP(date)}の日中のストレスや、寝る前の習慣
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            0時を過ぎても寝る前なら、まだこの日の記録でOK
          </p>
        </div>

        <EveningForm
          key={`evening-${date}`}
          date={date}
          initialData={
            dailyLog
              ? {
                  stressScore: dailyLog.stressScore ?? null,
                  stressSources: (dailyLog.stressSources as string[]) ?? [],
                  lateScreen: dailyLog.lateScreen ?? false,
                  alcohol: dailyLog.alcohol ?? false,
                  exercise: dailyLog.exercise ?? false,
                  note: dailyLog.note ?? "",
                }
              : null
          }
        />
      </section>
    </div>
  );
}
