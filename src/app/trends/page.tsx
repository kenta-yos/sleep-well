import { TrendsClient } from "./trends-client";
import { getCombinedData } from "@/lib/db/queries";

export default async function TrendsPage() {
  // Fetch max range, client will filter
  const { sleep, logs } = await getCombinedData(90);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">トレンド</h1>
      <TrendsClient
        sleepRecords={JSON.parse(JSON.stringify(sleep))}
        dailyLogs={JSON.parse(JSON.stringify(logs))}
      />
    </div>
  );
}
