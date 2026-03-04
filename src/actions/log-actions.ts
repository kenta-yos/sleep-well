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
    alcohol: boolean;
    exercise: boolean;
    socializing: boolean;
    bathing: boolean;
    intenseFocus: boolean;
    reading: boolean;
    lateMeal: boolean;
    note: string;
  }
) {
  await db
    .insert(dailyLogs)
    .values({
      date,
      stressScore: data.stressScore,
      stressSources: data.stressSources,
      alcohol: data.alcohol,
      exercise: data.exercise,
      socializing: data.socializing,
      bathing: data.bathing,
      intenseFocus: data.intenseFocus,
      reading: data.reading,
      lateMeal: data.lateMeal,
      note: data.note || null,
    })
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: {
        stressScore: sql`excluded.stress_score`,
        stressSources: sql`excluded.stress_sources`,
        alcohol: sql`excluded.alcohol`,
        exercise: sql`excluded.exercise`,
        socializing: sql`excluded.socializing`,
        bathing: sql`excluded.bathing`,
        intenseFocus: sql`excluded.intense_focus`,
        reading: sql`excluded.reading`,
        lateMeal: sql`excluded.late_meal`,
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
      alcohol: false,
      exercise: false,
      socializing: false,
      bathing: false,
      intenseFocus: false,
      reading: false,
      lateMeal: false,
      note: null,
      updatedAt: new Date(),
    })
    .where(eq(dailyLogs.date, date));
  return { ok: true };
}
