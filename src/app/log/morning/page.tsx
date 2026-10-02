import Link from "next/link";
import { getEffectiveToday, formatDateJP } from "@/lib/date-utils";
import { getSleepRecordByDate, getDailyLogByDate } from "@/lib/db/queries";
import { MorningForm } from "./morning-form";
import { timestampToTime } from "@/lib/sleep-utils";

export default async function MorningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getEffectiveToday();

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
      <div className="flex items-center gap-2">
        <Link
          href={sleepRecord ? `/log?date=${date}` : "/"}
          aria-label="閉じる"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-surface"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </Link>
        <svg className="h-5 w-5 text-sky" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <h1 className="text-sm font-bold">朝のチェックイン</h1>
        <span className="ml-auto text-xs text-text-muted">{formatDateJP(date)}</span>
      </div>

      <MorningForm key={date} date={date} initialData={initialData} />
    </div>
  );
}
