import { getLatestWeeklyInsight, getLatestMonthlyInsight } from "@/lib/db/queries";
import { ReviewClient } from "./review-client";

export default async function ReviewPage() {
  const [weeklyInsight, monthlyInsight] = await Promise.all([
    getLatestWeeklyInsight(),
    getLatestMonthlyInsight(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">AI レビュー</h1>
        <p className="text-sm text-text-muted">
          AIが睡眠と生活習慣を分析します
        </p>
      </div>

      <ReviewClient
        weeklyContent={weeklyInsight?.content ?? null}
        weeklyDate={weeklyInsight?.date ?? null}
        monthlyContent={monthlyInsight?.content ?? null}
        monthlyDate={monthlyInsight?.date ?? null}
      />
    </div>
  );
}
