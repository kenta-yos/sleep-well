import { TrendsClient } from "./trends-client";
import { getAllCombinedData } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const { sleep, logs } = await getAllCombinedData();

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
