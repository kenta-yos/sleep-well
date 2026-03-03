import { getTodayJST } from "@/lib/date-utils";
import { getMonthlyData } from "@/lib/db/queries";
import { HistoryClient } from "./history-client";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const today = getTodayJST();

  // Parse ?month=YYYY-MM, default to current month
  let year: number;
  let month: number;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  } else {
    const [y, m] = today.split("-").map(Number);
    year = y;
    month = m;
  }

  const { sleep, logs } = await getMonthlyData(year, month);

  return (
    <HistoryClient
      year={year}
      month={month}
      today={today}
      sleepRecords={sleep}
      dailyLogs={logs}
    />
  );
}
