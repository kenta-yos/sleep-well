import { getTodayJST } from "@/lib/date-utils";
import { getSleepRecordByDate, getDailyLogByDate } from "@/lib/db/queries";
import { SleepSummaryCard } from "@/components/log/sleep-summary-card";
import { MorningForm } from "./morning-form";

export default async function MorningPage() {
  const today = getTodayJST();
  const [sleepRecord, dailyLog] = await Promise.all([
    getSleepRecordByDate(today),
    getDailyLogByDate(today),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">おはよう</h1>
        <p className="text-sm text-text-muted">今朝のすっきり度を記録しよう</p>
      </div>

      <SleepSummaryCard record={sleepRecord} />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">
          今朝のすっきり度は？
        </h2>
        <MorningForm
          date={today}
          initialScore={dailyLog?.freshnessScore ?? null}
        />
      </div>
    </div>
  );
}
