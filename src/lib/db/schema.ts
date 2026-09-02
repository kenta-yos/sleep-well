import {
  pgTable,
  text,
  date,
  integer,
  json,
  timestamp,
  serial,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const sleepRecords = pgTable(
  "sleep_records",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    bedtime: timestamp("bedtime", { withTimezone: true }),
    wakeTime: timestamp("wake_time", { withTimezone: true }),
    totalSleepMinutes: integer("total_sleep_minutes"),
    deepMinutes: integer("deep_minutes"),
    lightMinutes: integer("light_minutes"),
    remMinutes: integer("rem_minutes"),
    awakeMinutes: integer("awake_minutes"),
    avgHeartRate: integer("avg_heart_rate"),
    minHeartRate: integer("min_heart_rate"),
    maxHeartRate: integer("max_heart_rate"),
    stageItems: json("stage_items"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("sleep_records_date_idx").on(table.date)]
);

export const dailyLogs = pgTable(
  "daily_logs",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    freshnessScore: integer("freshness_score"), // 1-5
    stressSources: json("stress_sources").$type<Record<string, number>>(),
    alcohol: boolean("alcohol").default(false),
    exercise: boolean("exercise").default(false),
    socializing: boolean("socializing").default(false),
    bathing: boolean("bathing").default(false),
    intenseFocus: boolean("intense_focus").default(false),
    reading: boolean("reading").default(false),
    lateMeal: boolean("late_meal").default(false),
    note: text("note"),
    panasAnswers: json("panas_answers"),
    panasPositive: integer("panas_positive"),
    panasNegative: integer("panas_negative"),
    pssAnswers: json("pss_answers"),
    pssScore: integer("pss_score"),
    pssWindow: text("pss_window"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("daily_logs_date_idx").on(table.date)]
);

export const aiInsights = pgTable(
  "ai_insights",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    type: text("type").notNull(), // 'monthly' — the month's 1st is the date
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  // One insight per (month, type): regenerating replaces instead of piling up.
  (table) => [uniqueIndex("ai_insights_date_type_idx").on(table.date, table.type)]
);

// Types
export type SleepRecord = typeof sleepRecords.$inferSelect;
export type NewSleepRecord = typeof sleepRecords.$inferInsert;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert;
export type AiInsight = typeof aiInsights.$inferSelect;

// The subsets the trends charts actually read. Keeps the page from shipping
// stage_items, PANAS answers and diary notes to the browser.
export type TrendsSleep = Pick<
  SleepRecord,
  | "date"
  | "totalSleepMinutes"
  | "deepMinutes"
  | "lightMinutes"
  | "remMinutes"
  | "avgHeartRate"
  | "minHeartRate"
  | "maxHeartRate"
> & {
  // Serialized to ISO strings before crossing the server/client boundary.
  bedtime: string | null;
  wakeTime: string | null;
};
export type TrendsLog = Pick<
  DailyLog,
  "date" | "freshnessScore" | "panasPositive" | "panasNegative" | "stressSources"
>;
