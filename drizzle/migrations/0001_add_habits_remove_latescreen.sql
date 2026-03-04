-- Add new habit columns
ALTER TABLE "daily_logs" ADD COLUMN "socializing" boolean DEFAULT false;
ALTER TABLE "daily_logs" ADD COLUMN "bathing" boolean DEFAULT false;
ALTER TABLE "daily_logs" ADD COLUMN "intense_focus" boolean DEFAULT false;
ALTER TABLE "daily_logs" ADD COLUMN "reading" boolean DEFAULT false;
ALTER TABLE "daily_logs" ADD COLUMN "late_meal" boolean DEFAULT false;

-- Remove old column
ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "late_screen";
