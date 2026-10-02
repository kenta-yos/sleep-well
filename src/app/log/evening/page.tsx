import { getEffectiveToday, formatDateJP, monthStart } from "@/lib/date-utils";
import { getDailyLogByDate, getMonthlyGoals } from "@/lib/db/queries";
import { DiaryForm } from "./evening-form";

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getEffectiveToday();

  const [log, goals] = await Promise.all([
    getDailyLogByDate(date),
    getMonthlyGoals(monthStart(date)),
  ]);

  return (
    <DiaryForm
      key={date}
      date={date}
      dateLabel={formatDateJP(date)}
      goals={goals}
      initialNote={log?.note ?? ""}
    />
  );
}
