import { getTodayJST, formatDateJP } from "@/lib/date-utils";
import { getSleepRecordByDate, getDailyLogByDate } from "@/lib/db/queries";
import { SleepSummaryCard } from "@/components/log/sleep-summary-card";
import { DateNav } from "@/components/ui/date-nav";
import { MorningForm } from "./morning/morning-form";
import { EveningForm } from "./evening/evening-form";

export default async function LogPage({
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

  return (
    <div className="space-y-8">
      <DateNav date={date} today={today} />

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
      </section>
    </div>
  );
}
