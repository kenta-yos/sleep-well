import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sleepRecords, dailyLogs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { timeToTimestamp, timestampToTime } from "@/lib/sleep-utils";

interface SleepPayload {
  date: string;
  bedtime: string; // "HH:MM"
  wakeTime: string; // "HH:MM"
  totalSleepMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  remMinutes: number;
  avgHeartRate: number;
  freshnessScore: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SleepPayload;
  const {
    date,
    bedtime,
    wakeTime,
    totalSleepMinutes,
    deepMinutes,
    lightMinutes,
    remMinutes,
    avgHeartRate,
    freshnessScore,
  } = body;

  if (!date || !bedtime || !wakeTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const bedtimeTs = timeToTimestamp(date, bedtime, true);
  const wakeTimeTs = timeToTimestamp(date, wakeTime, false);

  // Upsert sleep_records
  await db
    .insert(sleepRecords)
    .values({
      date,
      bedtime: bedtimeTs,
      wakeTime: wakeTimeTs,
      totalSleepMinutes,
      deepMinutes,
      lightMinutes,
      remMinutes,
      avgHeartRate,
    })
    .onConflictDoUpdate({
      target: sleepRecords.date,
      set: {
        bedtime: sql`excluded.bedtime`,
        wakeTime: sql`excluded.wake_time`,
        totalSleepMinutes: sql`excluded.total_sleep_minutes`,
        deepMinutes: sql`excluded.deep_minutes`,
        lightMinutes: sql`excluded.light_minutes`,
        remMinutes: sql`excluded.rem_minutes`,
        avgHeartRate: sql`excluded.avg_heart_rate`,
      },
    });

  // Upsert daily_logs (freshness score)
  await db
    .insert(dailyLogs)
    .values({ date, freshnessScore })
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: {
        freshnessScore: sql`excluded.freshness_score`,
        updatedAt: sql`now()`,
      },
    });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const [sleep] = await db
    .select()
    .from(sleepRecords)
    .where(eq(sleepRecords.date, date));

  const [log] = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.date, date));

  return NextResponse.json({
    sleep: sleep
      ? {
          bedtime: timestampToTime(sleep.bedtime),
          wakeTime: timestampToTime(sleep.wakeTime),
          totalSleepMinutes: sleep.totalSleepMinutes,
          deepMinutes: sleep.deepMinutes,
          lightMinutes: sleep.lightMinutes,
          remMinutes: sleep.remMinutes,
          avgHeartRate: sleep.avgHeartRate,
          sleepScore: sleep.sleepScore,
        }
      : null,
    freshnessScore: log?.freshnessScore ?? null,
  });
}
