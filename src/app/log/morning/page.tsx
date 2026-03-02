import { getTodayJST, formatDateJP } from "@/lib/date-utils";
import { getSleepRecordByDate, getDailyLogByDate } from "@/lib/db/queries";
import { SleepSummaryCard } from "@/components/log/sleep-summary-card";
import { DateNav } from "@/components/ui/date-nav";
import { MorningForm } from "./morning-form";

export default async function MorningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = getTodayJST();
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const [sleepRecord, dailyLog] = await Promise.all([
    getSleepRecordByDate(date),
    getDailyLogByDate(date),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">朝の記録</h1>
        <p className="text-sm text-text-muted">すっきり度を記録しよう</p>
      </div>

      <DateNav date={date} today={today} />

      <SleepSummaryCard record={sleepRecord} />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">
          {date === today ? "今朝" : formatDateJP(date)}のすっきり度は？
        </h2>
        <MorningForm
          date={date}
          initialScore={dailyLog?.freshnessScore ?? null}
        />
      </div>
    </div>
  );
}
