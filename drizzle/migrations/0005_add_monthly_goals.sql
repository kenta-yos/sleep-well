-- 月末の夜ログで翌月の目標を登録し、その月の夜ログに常に表示する。
-- 1か月1行。month はその月の1日（ai_insights と同じ持ち方）。
CREATE TABLE IF NOT EXISTS "monthly_goals" (
  "id" serial PRIMARY KEY,
  "month" date NOT NULL,
  "goals" json NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_goals_month_idx" ON "monthly_goals" ("month");
