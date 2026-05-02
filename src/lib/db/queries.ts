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

export async function getLatestMonthlyInsight() {
  const [insight] = await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.type, "monthly"))
    .orderBy(desc(aiInsights.date))
    .limit(1);
  return insight ?? null;
}

export async function getMonthlyInsight(year: number, month: number) {
  const date = `${year}-${String(month).padStart(2, "0")}-01`;
  const [insight] = await db
    .select()
    .from(aiInsights)
    .where(and(eq(aiInsights.type, "monthly"), eq(aiInsights.date, date)))
    .orderBy(desc(aiInsights.createdAt))
    .limit(1);
  return insight ?? null;
}

export async function getSleepRecordCount() {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sleepRecords);
  return result?.count ?? 0;
}

// Monthly data for history page
// Pairing: night of D → evening log(D) + morning log(D+1) + sleep(D+1)
export async function getMonthlyData(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad(month)}-01`;
  // Next month's 1st: used for the last night's morning log & sleep data
  const next = new Date(year, month, 1); // JS Date month is 0-indexed, so `month` (1-indexed) = next month
  const nextMonthFirst = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`;

  // dailyLogs: [monthStart, nextMonthFirst] inclusive
  const logs = await db
    .select()
    .from(dailyLogs)
    .where(and(gte(dailyLogs.date, monthStart), lte(dailyLogs.date, nextMonthFirst)))
    .orderBy(dailyLogs.date);

  // sleepRecords: [monthStart day2, nextMonthFirst] — sleep on D+1 pairs with night D
  const day2 = `${year}-${pad(month)}-02`;
  const sleep = await db
    .select()
    .from(sleepRecords)
    .where(and(gte(sleepRecords.date, day2), lte(sleepRecords.date, nextMonthFirst)))
    .orderBy(sleepRecords.date);

  return { sleep, logs };
}
