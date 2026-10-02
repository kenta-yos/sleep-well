-- PSS-10 は 2026-09 に入力を終了（半年で3回・得点 10 / 9 / 11）。
-- 表示・AIサマリーからも外したので、列ごと削除する。
ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "pss_answers";
ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "pss_score";
ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "pss_window";
