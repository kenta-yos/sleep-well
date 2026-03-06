import {
  pgTable,
  text,
  date,
  integer,
  real,
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
    stressScore: integer("stress_score"), // 1-5
    stressSources: json("stress_sources").$type<string[]>(),
    alcohol: boolean("alcohol").default(false),
    exercise: boolean("exercise").default(false),
    socializing: boolean("socializing").default(false),
    bathing: boolean("bathing").default(false),
    intenseFocus: boolean("intense_focus").default(false),
    reading: boolean("reading").default(false),
    lateMeal: boolean("late_meal").default(false),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("daily_logs_date_idx").on(table.date)]
);

export const computedMetrics = pgTable(
  "computed_metrics",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    bedrimeDeviationMinutes: real("bedtime_deviation_minutes"),
    avgFreshness7d: real("avg_freshness_7d"),
    avgSleepDuration7d: real("avg_sleep_duration_7d"),
  },
  (table) => [uniqueIndex("computed_metrics_date_idx").on(table.date)]
);

export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  type: text("type").notNull(), // 'nightly' | 'weekly'
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Types
export type SleepRecord = typeof sleepRecords.$inferSelect;
export type NewSleepRecord = typeof sleepRecords.$inferInsert;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert;
export type ComputedMetric = typeof computedMetrics.$inferSelect;
export type AiInsight = typeof aiInsights.$inferSelect;
