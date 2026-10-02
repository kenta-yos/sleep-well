import { db } from "./index";
import { sleepRecords, dailyLogs, aiInsights, monthlyGoals } from "./schema";
import type { TrendsSleep } from "./schema";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";

// Sleep Records
export async function getSleepRecordByDate(date: string) {
  const [record] = await db
    .select()
    .from(sleepRecords)
    .where(eq(sleepRecords.date, date));
  return record ?? null;
}

// Daily Logs
export async function getDailyLogByDate(date: string) {
  const [log] = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.date, date));
  return log ?? null;
}

// Combined data for trends
// Trends page: only the columns the charts actually read. Selecting * shipped
// stage_items, the raw answer blobs and every diary note to the browser (~373KB).
export async function getTrendsData() {
  const sleep = await db
    .select({
      date: sleepRecords.date,
      bedtime: sleepRecords.bedtime,
      wakeTime: sleepRecords.wakeTime,
      totalSleepMinutes: sleepRecords.totalSleepMinutes,
      deepMinutes: sleepRecords.deepMinutes,
      lightMinutes: sleepRecords.lightMinutes,
      remMinutes: sleepRecords.remMinutes,
      avgHeartRate: sleepRecords.avgHeartRate,
      minHeartRate: sleepRecords.minHeartRate,
      maxHeartRate: sleepRecords.maxHeartRate,
    })
    .from(sleepRecords)
    .orderBy(sleepRecords.date);

  const logs = await db
    .select({
      date: dailyLogs.date,
      freshnessScore: dailyLogs.freshnessScore,
      stressSources: dailyLogs.stressSources,
      tdmsVitality: dailyLogs.tdmsVitality,
      tdmsStability: dailyLogs.tdmsStability,
      exercise: dailyLogs.exercise,
      alcohol: dailyLogs.alcohol,
      socializing: dailyLogs.socializing,
      bathing: dailyLogs.bathing,
      intenseFocus: dailyLogs.intenseFocus,
      reading: dailyLogs.reading,
      lateMeal: dailyLogs.lateMeal,
    })
    .from(dailyLogs)
    .orderBy(dailyLogs.date);

  const serialized: TrendsSleep[] = sleep.map((r) => ({
    ...r,
    bedtime: r.bedtime?.toISOString() ?? null,
    wakeTime: r.wakeTime?.toISOString() ?? null,
  }));

  return { sleep: serialized, logs };
}

// AI Insights
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
    .limit(1);
  return insight ?? null;
}

export async function getPreviousMonthlyInsights(
  year: number,
  month: number
) {
  const targetDate = `${year}-${String(month).padStart(2, "0")}-01`;
  return db
    .select({ date: aiInsights.date, content: aiInsights.content })
    .from(aiInsights)
    .where(
      and(eq(aiInsights.type, "monthly"), sql`${aiInsights.date} < ${targetDate}`)
    )
    .orderBy(aiInsights.date);
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

  // dailyLogs: [monthStart, monthEnd] — only the target month
  const monthEnd = new Date(year, month, 0); // last day of target month
  const monthEndStr = `${monthEnd.getFullYear()}-${pad(monthEnd.getMonth() + 1)}-${pad(monthEnd.getDate())}`;
  const logs = await db
    .select()
    .from(dailyLogs)
    .where(and(gte(dailyLogs.date, monthStart), lte(dailyLogs.date, monthEndStr)))
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

/**
 * Which days of a month have a morning and a night record, for the calendar.
 * Unlike getMonthlyData this keeps each row on its own date: a day's page
 * shows that date's morning and that date's night.
 */
export async function getCalendarMonth(from: string, to: string) {
  const [sleep, logs] = await Promise.all([
    db
      .select({ date: sleepRecords.date })
      .from(sleepRecords)
      .where(and(gte(sleepRecords.date, from), sql`${sleepRecords.date} < ${to}`)),
    db
      .select({
        date: dailyLogs.date,
        night: sql<boolean>`(${dailyLogs.tdmsVitality} is not null or ${dailyLogs.panasPositive} is not null or ${dailyLogs.stressSources} is not null or coalesce(${dailyLogs.note}, '') <> '')`,
      })
      .from(dailyLogs)
      .where(and(gte(dailyLogs.date, from), sql`${dailyLogs.date} < ${to}`)),
  ]);
  return {
    morning: new Set(sleep.map((r) => r.date)),
    night: new Set(logs.filter((l) => l.night).map((l) => l.date)),
  };
}

// Monthly Goals
/** `month` is the month's 1st ("YYYY-MM-01"). */
export async function getMonthlyGoals(month: string): Promise<string[]> {
  const [row] = await db
    .select({ goals: monthlyGoals.goals })
    .from(monthlyGoals)
    .where(eq(monthlyGoals.month, month));
  return row?.goals ?? [];
}
