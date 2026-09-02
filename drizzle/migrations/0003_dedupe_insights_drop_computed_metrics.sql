-- Regenerating a monthly summary used to INSERT a new row, so the same month
-- could appear several times. getPreviousMonthlyInsights feeds every row to the
-- model, which weighted those months more heavily than the rest.
-- Keep the newest row per (date, type). Rows are backed up in
-- backup-ai-insights-2026-09-02.json.
DELETE FROM "ai_insights" a
USING "ai_insights" b
WHERE a."date" = b."date"
  AND a."type" = b."type"
  AND (a."created_at", a."id") < (b."created_at", b."id");

ALTER TABLE "ai_insights" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS "ai_insights_date_type_idx" ON "ai_insights" ("date", "type");

-- Never populated (0 rows) and never queried; the app computes these on read.
DROP TABLE IF EXISTS "computed_metrics";
