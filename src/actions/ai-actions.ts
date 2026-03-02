"use server";

import { db } from "@/lib/db";
import { aiInsights } from "@/lib/db/schema";
import { getRecentSleepRecords, getRecentDailyLogs } from "@/lib/db/queries";
import { generateWeeklyReview } from "@/lib/ai";
import { getTodayJST } from "@/lib/date-utils";

export async function generateWeeklyReviewAction() {
  const today = getTodayJST();
  const [sleep, logs] = await Promise.all([
    getRecentSleepRecords(7),
    getRecentDailyLogs(7),
  ]);

  if (sleep.length === 0) {
    return { error: "睡眠データがありません", content: null };
  }

  const content = await generateWeeklyReview(sleep, logs);

  await db.insert(aiInsights).values({
    date: today,
    type: "weekly",
    content,
  });

  return { error: null, content };
}
