import { getTodayJST } from "@/lib/date-utils";
import { getDailyLogByDate } from "@/lib/db/queries";
import { EveningForm } from "./evening-form";

export default async function EveningPage() {
  const today = getTodayJST();
  const dailyLog = await getDailyLogByDate(today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">おやすみ前</h1>
        <p className="text-sm text-text-muted">今日の振り返りを記録しよう</p>
      </div>

      <EveningForm
        date={today}
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
