import { getLatestWeeklyInsight } from "@/lib/db/queries";
import { ReviewClient } from "./review-client";

export default async function ReviewPage() {
  const latestInsight = await getLatestWeeklyInsight();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">週次レビュー</h1>
        <p className="text-sm text-text-muted">
          AIが1週間の睡眠と生活習慣を分析します
        </p>
      </div>

      <ReviewClient
        initialContent={latestInsight?.content ?? null}
        initialDate={latestInsight?.date ?? null}
      />
    </div>
  );
}
