"use server";

import { db } from "@/lib/db";
import { dailyLogs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function saveFreshnessScore(date: string, score: number) {
  await db
    .insert(dailyLogs)
    .values({ date, freshnessScore: score })
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: {
        freshnessScore: sql`excluded.freshness_score`,
        updatedAt: sql`now()`,
      },
    });
  return { ok: true };
}

export async function saveEveningLog(
  date: string,
  data: {
    stressScore: number | null;
    stressSources: string[];
    lateScreen: boolean;
    alcohol: boolean;
    exercise: boolean;
    note: string;
  }
) {
  await db
    .insert(dailyLogs)
    .values({
      date,
      stressScore: data.stressScore,
      stressSources: data.stressSources,
      lateScreen: data.lateScreen,
      alcohol: data.alcohol,
      exercise: data.exercise,
      note: data.note || null,
    })
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: {
        stressScore: sql`excluded.stress_score`,
        stressSources: sql`excluded.stress_sources`,
        lateScreen: sql`excluded.late_screen`,
        alcohol: sql`excluded.alcohol`,
        exercise: sql`excluded.exercise`,
        note: sql`excluded.note`,
        updatedAt: sql`now()`,
      },
    });
  return { ok: true };
}

export async function clearFreshnessScore(date: string) {
  await db
    .update(dailyLogs)
    .set({ freshnessScore: null, updatedAt: new Date() })
    .where(eq(dailyLogs.date, date));
  return { ok: true };
}

export async function clearEveningLog(date: string) {
  await db
    .update(dailyLogs)
    .set({
      stressScore: null,
      stressSources: null,
      lateScreen: false,
      alcohol: false,
      exercise: false,
      note: null,
      updatedAt: new Date(),
    })
    .where(eq(dailyLogs.date, date));
  return { ok: true };
}
