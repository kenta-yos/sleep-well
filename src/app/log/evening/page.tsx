import { getTodayJST, formatDateJP } from "@/lib/date-utils";
import { getDailyLogByDate } from "@/lib/db/queries";
import { DateNav } from "@/components/ui/date-nav";
import { EveningForm } from "./evening-form";

export default async function EveningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = getTodayJST();
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const dailyLog = await getDailyLogByDate(date);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">夜の記録</h1>
        <p className="text-sm text-text-muted">
          {formatDateJP(date)}の日中のストレスや、寝る前の習慣を記録
        </p>
      </div>

      <DateNav date={date} today={today} />

      <p className="rounded-xl bg-surface px-3 py-2 text-xs text-text-muted">
        0時を過ぎても寝る前なら、まだこの日の夜ログでOK
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
