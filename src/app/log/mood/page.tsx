import Link from "next/link";
import { getTodayJST, formatDateJP } from "@/lib/date-utils";
import { getDailyLogByDate } from "@/lib/db/queries";
import { DateNav } from "@/components/ui/date-nav";
import { MoodForm } from "./mood-form";

export default async function MoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const today = getTodayJST();
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const dailyLog = await getDailyLogByDate(date);

  return (
    <div className="space-y-6">
      <Link
        href={`/log?date=${date}`}
        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        一覧に戻る
      </Link>

      <div>
        <h1 className="text-xl font-bold">気分チェックイン</h1>
        <p className="text-sm text-text-muted">
          {formatDateJP(date)}の気分を振り返る
        </p>
      </div>

      <DateNav date={date} today={today} />

      <MoodForm
        key={date}
        date={date}
        initialPanas={
          dailyLog?.panasAnswers as Record<string, number> | null ?? null
        }
        initialPss={
          dailyLog?.pssAnswers as Record<string, number> | null ?? null
        }
        savedPositive={dailyLog?.panasPositive ?? null}
        savedNegative={dailyLog?.panasNegative ?? null}
        savedPssScore={dailyLog?.pssScore ?? null}
      />
    </div>
  );
}
