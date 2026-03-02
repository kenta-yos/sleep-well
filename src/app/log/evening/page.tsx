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
          {date === today ? "今日" : formatDateJP(date)}の振り返りを記録しよう
        </p>
      </div>

      <DateNav date={date} today={today} />

      <EveningForm
        date={date}
        initialData={
          dailyLog
            ? {
                stressScore: dailyLog.stressScore ?? 3,
                stressSources: (dailyLog.stressSources as string[]) ?? [],
                lateScreen: dailyLog.lateScreen ?? false,
                alcohol: dailyLog.alcohol ?? false,
                exercise: dailyLog.exercise ?? false,
                note: dailyLog.note ?? "",
              }
            : null
        }
      />
    </div>
  );
}
