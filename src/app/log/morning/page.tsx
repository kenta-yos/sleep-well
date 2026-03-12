import Link from "next/link";
import { getTodayJST, formatDateJP } from "@/lib/date-utils";
import { getSleepRecordByDate, getDailyLogByDate } from "@/lib/db/queries";
import { DateNav } from "@/components/ui/date-nav";
import { MorningForm } from "./morning-form";
import { timestampToTime } from "@/lib/sleep-utils";

export default async function MorningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = getTodayJST();
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const [sleepRecord, dailyLog] = await Promise.all([
    getSleepRecordByDate(date),
    getDailyLogByDate(date),
  ]);

  const initialData = {
    freshnessScore: dailyLog?.freshnessScore ?? null,
    bedtime: timestampToTime(sleepRecord?.bedtime ?? null),
    wakeTime: timestampToTime(sleepRecord?.wakeTime ?? null),
    totalSleepMinutes: sleepRecord?.totalSleepMinutes ?? null,
    deepMinutes: sleepRecord?.deepMinutes ?? null,
    lightMinutes: sleepRecord?.lightMinutes ?? null,
    remMinutes: sleepRecord?.remMinutes ?? null,
    avgHeartRate: sleepRecord?.avgHeartRate ?? null,
  };

  return (
    <div className="space-y-4">
      <Link
        href={`/log?date=${date}`}
        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        一覧に戻る
      </Link>

      <div>
        <h1 className="text-xl font-bold">朝の記録</h1>
        <p className="text-sm text-text-muted">
          {formatDateJP(date)}の睡眠データを入力
        </p>
      </div>

      <DateNav date={date} today={today} />

      <MorningForm key={date} date={date} initialData={initialData} />
    </div>
  );
}
