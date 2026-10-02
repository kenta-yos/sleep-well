import { getEffectiveToday } from "@/lib/date-utils";
import { getDailyLogByDate } from "@/lib/db/queries";
import { nightStepHref } from "@/lib/checkin";
import { CheckinHeader } from "@/components/checkin/checkin-header";
import { StressForm } from "./stress-form";

export default async function StressPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getEffectiveToday();

  const log = await getDailyLogByDate(date);

  return (
    <div className="space-y-4">
      <CheckinHeader
        backHref={nightStepHref("mood", date)}
        total={3}
        current={2}
        right="ストレス・習慣"
      />
      <StressForm
        key={date}
        date={date}
        initial={{
          stressSources: (log?.stressSources as Record<string, number> | null) ?? {},
          alcohol: log?.alcohol ?? false,
          exercise: log?.exercise ?? false,
          socializing: log?.socializing ?? false,
          bathing: log?.bathing ?? false,
          intenseFocus: log?.intenseFocus ?? false,
          reading: log?.reading ?? false,
          lateMeal: log?.lateMeal ?? false,
        }}
      />
    </div>
  );
}
