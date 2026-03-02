import { db } from "./index";
import { sleepRecords, dailyLogs, computedMetrics, aiInsights } from "./schema";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";

// Sleep Records
export async function getSleepRecordByDate(date: string) {
  const [record] = await db
    .select()
    .from(sleepRecords)
    .where(eq(sleepRecords.date, date));
  return record ?? null;
}

export async function getRecentSleepRecords(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return db
    .select()
    .from(sleepRecords)
    .where(gte(sleepRecords.date, cutoffStr))
    .orderBy(desc(sleepRecords.date));
}

export async function getSleepRecordsRange(startDate: string, endDate: string) {
  return db
    .select()
    .from(sleepRecords)
    .where(and(gte(sleepRecords.date, startDate), lte(sleepRecords.date, endDate)))
    .orderBy(sleepRecords.date);
}

// Daily Logs
export async function getDailyLogByDate(date: string) {
  const [log] = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.date, date));
  return log ?? null;
}

export async function getRecentDailyLogs(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return db
    .select()
    .from(dailyLogs)
    .where(gte(dailyLogs.date, cutoffStr))
    .orderBy(desc(dailyLogs.date));
}

// Combined data for trends
export async function getCombinedData(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const sleep = await db
    .select()
    .from(sleepRecords)
    .where(gte(sleepRecords.date, cutoffStr))
    .orderBy(sleepRecords.date);

  const logs = await db
    .select()
    .from(dailyLogs)
    .where(gte(dailyLogs.date, cutoffStr))
    .orderBy(dailyLogs.date);

  return { sleep, logs };
}

// AI Insights
export async function getLatestWeeklyInsight() {
  const [insight] = await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.type, "weekly"))
    .orderBy(desc(aiInsights.date))
    .limit(1);
  return insight ?? null;
}

export async function getSleepRecordCount() {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sleepRecords);
  return result?.count ?? 0;
}
