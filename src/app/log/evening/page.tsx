import Link from "next/link";
import { getEffectiveToday, formatDateJP } from "@/lib/date-utils";
import { getDailyLogByDate } from "@/lib/db/queries";
import { DateNav } from "@/components/ui/date-nav";
import { EveningForm } from "./evening-form";

export default async function EveningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = getEffectiveToday();
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const dailyLog = await getDailyLogByDate(date);

  return (
    <div className="space-y-6">
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
        <h1 className="text-xl font-bold">夜の記録</h1>
        <p className="text-sm text-text-muted">
          {formatDateJP(date)}の日記と、ストレスや習慣を記録
        </p>
      </div>

      <DateNav date={date} today={today} />

      <p className="rounded-xl bg-surface px-3 py-2 text-xs text-text-muted">
        0時を過ぎても4時までは前日の夜ログとして開きます。書いた内容は自動で保存されます。
      </p>

      <EveningForm
        key={date}
        date={date}
        initialData={
          dailyLog
            ? {
                stressSources: (dailyLog.stressSources as Record<string, number>) ?? {},
                alcohol: dailyLog.alcohol ?? false,
                exercise: dailyLog.exercise ?? false,
                socializing: dailyLog.socializing ?? false,
                bathing: dailyLog.bathing ?? false,
                intenseFocus: dailyLog.intenseFocus ?? false,
                reading: dailyLog.reading ?? false,
                lateMeal: dailyLog.lateMeal ?? false,
                note: dailyLog.note ?? "",
              }
            : null
        }
      />
    </div>
  );
}
