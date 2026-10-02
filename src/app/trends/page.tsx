import { TrendsClient } from "./trends-client";
import { getTrendsData } from "@/lib/db/queries";
import { ReviewTabs } from "@/components/layout/review-tabs";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const { sleep, logs } = await getTrendsData();

  return (
    <div className="space-y-6">
      <ReviewTabs />
      <TrendsClient sleepRecords={sleep} dailyLogs={logs} />
    </div>
  );
}
