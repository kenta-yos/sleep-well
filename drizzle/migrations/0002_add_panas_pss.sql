ALTER TABLE "daily_logs" ADD COLUMN "panas_answers" json;
ALTER TABLE "daily_logs" ADD COLUMN "panas_positive" integer;
ALTER TABLE "daily_logs" ADD COLUMN "panas_negative" integer;
ALTER TABLE "daily_logs" ADD COLUMN "pss_answers" json;
ALTER TABLE "daily_logs" ADD COLUMN "pss_score" integer;
ALTER TABLE "daily_logs" ADD COLUMN "pss_window" text;
