"use server";

import { db } from "@/lib/db";
import { sleepRecords } from "@/lib/db/schema";
import {
  parseAggregatedCSV,
  parseDetailedCSV,
  mergeRecordsWithStages,
} from "@/lib/csv-parser";
import { sql } from "drizzle-orm";

export async function importCSVAction(formData: FormData) {
  const aggregatedFile = formData.get("aggregated") as File | null;
  const detailedFile = formData.get("detailed") as File | null;

  if (!aggregatedFile) {
    return { error: "集約CSVファイルを選択してください", count: 0 };
  }

  const aggregatedText = await aggregatedFile.text();
  let records = parseAggregatedCSV(aggregatedText);

  if (records.length === 0) {
    return { error: "睡眠データが見つかりません", count: 0 };
  }

  // Merge with detailed stage data if provided
  if (detailedFile) {
    const detailedText = await detailedFile.text();
    const stageMap = parseDetailedCSV(detailedText);
    records = mergeRecordsWithStages(records, stageMap);
  }

  // Upsert records in batches of 10
  let importedCount = 0;
  const BATCH_SIZE = 10;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((record) =>
        db
          .insert(sleepRecords)
          .values(record)
          .onConflictDoUpdate({
            target: sleepRecords.date,
            set: {
              bedtime: sql`excluded.bedtime`,
              wakeTime: sql`excluded.wake_time`,
              totalSleepMinutes: sql`excluded.total_sleep_minutes`,
              deepMinutes: sql`excluded.deep_minutes`,
              lightMinutes: sql`excluded.light_minutes`,
              remMinutes: sql`excluded.rem_minutes`,
              awakeMinutes: sql`excluded.awake_minutes`,
              avgHeartRate: sql`excluded.avg_heart_rate`,
              minHeartRate: sql`excluded.min_heart_rate`,
              maxHeartRate: sql`excluded.max_heart_rate`,
              sleepScore: sql`excluded.sleep_score`,
              stageItems: sql`excluded.stage_items`,
            },
          })
      )
    );
    importedCount += batch.length;
  }

  return { error: null, count: importedCount };
}
