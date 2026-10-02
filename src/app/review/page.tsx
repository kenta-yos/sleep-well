import { getLatestMonthlyInsight } from "@/lib/db/queries";
import { ReviewClient } from "./review-client";
import { ReviewTabs } from "@/components/layout/review-tabs";

export default async function ReviewPage() {
  const monthlyInsight = await getLatestMonthlyInsight();

  return (
    <div className="space-y-6">
      <ReviewTabs />

      <ReviewClient
        initialContent={monthlyInsight?.content ?? null}
        initialDate={monthlyInsight?.date ?? null}
      />
    </div>
  );
}
