"use server";

import { db } from "@/lib/db";
import { dailyLogs, monthlyGoals } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/** Night check-in step 2. Saving `{}` records "no stress today". */
export async function saveStressHabits(
  date: string,
  data: {
    stressSources: Record<string, number>;
    alcohol: boolean;
    exercise: boolean;
    socializing: boolean;
    bathing: boolean;
    intenseFocus: boolean;
    reading: boolean;
    lateMeal: boolean;
  }
) {
  await db
    .insert(dailyLogs)
    .values({ date, ...data })
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: {
        stressSources: sql`excluded.stress_sources`,
        alcohol: sql`excluded.alcohol`,
        exercise: sql`excluded.exercise`,
        socializing: sql`excluded.socializing`,
        bathing: sql`excluded.bathing`,
        intenseFocus: sql`excluded.intense_focus`,
        reading: sql`excluded.reading`,
        lateMeal: sql`excluded.late_meal`,
        updatedAt: sql`now()`,
      },
    });
  return { ok: true };
}

/** Night check-in step 3. Touches only the diary, so it cannot undo step 2. */
export async function saveDiary(date: string, note: string) {
  await db
    .insert(dailyLogs)
    .values({ date, note: note || null })
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: { note: sql`excluded.note`, updatedAt: sql`now()` },
    });
  return { ok: true };
}

export async function saveMoodLog(
  date: string,
  data: {
    tdmsAnswers: Record<string, number>;
    tdmsVitality: number;
    tdmsStability: number;
  }
) {
  await db
    .insert(dailyLogs)
    .values({
      date,
      tdmsAnswers: data.tdmsAnswers,
      tdmsVitality: data.tdmsVitality,
      tdmsStability: data.tdmsStability,
    })
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: {
        tdmsAnswers: sql`excluded.tdms_answers`,
        tdmsVitality: sql`excluded.tdms_vitality`,
        tdmsStability: sql`excluded.tdms_stability`,
        updatedAt: sql`now()`,
      },
    });
  return { ok: true };
}

export async function clearMoodLog(date: string) {
  await db
    .update(dailyLogs)
    .set({
      tdmsAnswers: null,
      tdmsVitality: null,
      tdmsStability: null,
      panasAnswers: null,
      panasPositive: null,
      panasNegative: null,
      updatedAt: new Date(),
    })
    .where(eq(dailyLogs.date, date));
  return { ok: true };
}

export async function clearEveningLog(date: string) {
  await db
    .update(dailyLogs)
    .set({
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

/** `month` is the month's 1st. Blank lines are dropped; an empty list clears the month. */
export async function saveMonthlyGoals(month: string, goals: string[]) {
  const cleaned = goals.map((g) => g.trim()).filter(Boolean);
  await db
    .insert(monthlyGoals)
    .values({ month, goals: cleaned })
    .onConflictDoUpdate({
      target: monthlyGoals.month,
      set: { goals: sql`excluded.goals`, updatedAt: sql`now()` },
    });
  return { ok: true };
}
