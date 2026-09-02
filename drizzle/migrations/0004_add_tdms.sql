-- Nightly mood scale moves from I-PANAS-SF to TDMS (二次元気分尺度).
-- Over 73 days every I-PANAS-SF item averaged 1.04-1.84 on its 1-5 scale:
-- summing unipolar intensity ratings floors out for a respondent whose affect
-- is not extreme. TDMS scores each dimension as positive items minus negative
-- items, so all-zero and all-five both land at 0 and the floor cannot form.
-- The PANAS columns stay: they hold real history and still feed the AI summary
-- for the months they cover.
ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "tdms_answers" json;
ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "tdms_vitality" integer;
ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "tdms_stability" integer;
