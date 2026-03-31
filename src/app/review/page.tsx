import { getLatestMonthlyInsight } from "@/lib/db/queries";
import { ReviewClient } from "./review-client";

export default async function ReviewPage() {
  const monthlyInsight = await getLatestMonthlyInsight();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">月次サマリー</h1>
        <p className="text-sm text-text-muted">
          AIが1ヶ月の睡眠と生活を分析します
        </p>
      </div>

      <ReviewClient
        initialContent={monthlyInsight?.content ?? null}
        initialDate={monthlyInsight?.date ?? null}
      />
    </div>
  );
}
