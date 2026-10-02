import { getEffectiveToday } from "@/lib/date-utils";
import { getDailyLogByDate } from "@/lib/db/queries";
import { CheckinHeader } from "@/components/checkin/checkin-header";
import { MoodForm } from "./mood-form";

export default async function MoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getEffectiveToday();

  const dailyLog = await getDailyLogByDate(date);

  return (
    <div className="space-y-4">
      <CheckinHeader closeHref="/" total={3} current={1} right="気分" />
      <MoodForm
        key={date}
        date={date}
        initialTdms={(dailyLog?.tdmsAnswers as Record<string, number> | null) ?? null}
        legacyPanasPositive={dailyLog?.panasPositive ?? null}
        legacyPanasNegative={dailyLog?.panasNegative ?? null}
      />
    </div>
  );
}
