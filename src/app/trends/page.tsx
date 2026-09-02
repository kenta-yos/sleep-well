import { TrendsClient } from "./trends-client";
import { getTrendsData } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const { sleep, logs } = await getTrendsData();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">トレンド</h1>
      <TrendsClient sleepRecords={sleep} dailyLogs={logs} />
    </div>
  );
}
