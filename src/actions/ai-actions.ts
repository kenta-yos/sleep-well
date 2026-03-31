"use server";

import { db } from "@/lib/db";
import { aiInsights } from "@/lib/db/schema";
import { getMonthlyData } from "@/lib/db/queries";
import { generateMonthlySummary } from "@/lib/ai";

export async function generateMonthlyReviewAction(year: number, month: number) {
  const { sleep, logs } = await getMonthlyData(year, month);

  if (sleep.length === 0) {
    return { error: "その月の睡眠データがありません", content: null };
  }

  const content = await generateMonthlySummary(sleep, logs, year, month);

  const pad = (n: number) => String(n).padStart(2, "0");
  await db.insert(aiInsights).values({
    date: `${year}-${pad(month)}-01`,
    type: "monthly",
    content,
  });

  return { error: null, content };
}
