import { neon } from "@neondatabase/serverless";
import Papa from "papaparse";
import * as fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

interface AggregatedRow {
  Uid: string;
  Sid: string;
  Tag: string;
  Key: string;
  Time: string;
  Value: string;
}

function unixToJSTDate(unixSeconds: number): string {
  const d = new Date((unixSeconds + 9 * 3600) * 1000);
  return d.toISOString().split("T")[0];
}

async function main() {
  const aggPath = "/Users/yoshiikenta/sleep-well/Myfitness-data/20260302_6841468420_MiFitness_hlth_center_aggregated_fitness_data.csv";
  const detPath = "/Users/yoshiikenta/sleep-well/Myfitness-data/20260302_6841468420_MiFitness_hlth_center_fitness_data.csv";

  // Parse aggregated
  const aggText = fs.readFileSync(aggPath, "utf-8");
  const aggResult = Papa.parse<AggregatedRow>(aggText, { header: true, skipEmptyLines: true });

  const records: any[] = [];
  for (const row of aggResult.data) {
    if (row.Tag !== "daily_report" || row.Key !== "sleep") continue;
    if (row.Sid !== "default") continue;
    let data: any;
    try { data = JSON.parse(row.Value); } catch { continue; }
    if (data.total_duration < 120) continue;

    const dateEpoch = parseInt(row.Time, 10);
    const date = unixToJSTDate(dateEpoch);

    const mainSeg = data.segment_details?.find((s: any) => s.duration === data.total_duration) ?? data.segment_details?.[0];

    records.push({
      date,
      bedtime: mainSeg ? new Date(mainSeg.bedtime * 1000).toISOString() : null,
      wake_time: mainSeg ? new Date(mainSeg.wake_up_time * 1000).toISOString() : null,
      total_sleep_minutes: data.total_duration,
      deep_minutes: data.sleep_deep_duration,
      light_minutes: data.sleep_light_duration,
      rem_minutes: data.sleep_rem_duration,
      awake_minutes: data.sleep_awake_duration,
      avg_heart_rate: data.avg_hr,
      min_heart_rate: data.min_hr,
      max_heart_rate: data.max_hr,
      sleep_score: data.sleep_score,
      stage_items: null,
    });
  }

  // Parse detailed for stage items
  const detText = fs.readFileSync(detPath, "utf-8");
  const detResult = Papa.parse<any>(detText, { header: true, skipEmptyLines: true });
  const stageMap = new Map<string, any[]>();
  for (const row of detResult.data) {
    if (row.Key !== "sleep") continue;
    let data: any;
    try { data = JSON.parse(row.Value); } catch { continue; }
    if (!data.items || data.items.length === 0 || data.duration < 120) continue;
    const date = unixToJSTDate(data.wake_up_time);
    const existing = stageMap.get(date);
    if (!existing || data.items.length > existing.length) {
      stageMap.set(date, data.items);
    }
  }

  // Merge stages
  for (const r of records) {
    const stages = stageMap.get(r.date);
    if (stages) r.stage_items = JSON.stringify(stages);
  }

  console.log(`Importing ${records.length} records...`);

  let count = 0;
  for (const r of records) {
    await sql`
      INSERT INTO sleep_records (date, bedtime, wake_time, total_sleep_minutes, deep_minutes, light_minutes, rem_minutes, awake_minutes, avg_heart_rate, min_heart_rate, max_heart_rate, sleep_score, stage_items)
      VALUES (${r.date}, ${r.bedtime}, ${r.wake_time}, ${r.total_sleep_minutes}, ${r.deep_minutes}, ${r.light_minutes}, ${r.rem_minutes}, ${r.awake_minutes}, ${r.avg_heart_rate}, ${r.min_heart_rate}, ${r.max_heart_rate}, ${r.sleep_score}, ${r.stage_items}::json)
      ON CONFLICT (date) DO UPDATE SET
        bedtime = EXCLUDED.bedtime,
        wake_time = EXCLUDED.wake_time,
        total_sleep_minutes = EXCLUDED.total_sleep_minutes,
        deep_minutes = EXCLUDED.deep_minutes,
        light_minutes = EXCLUDED.light_minutes,
        rem_minutes = EXCLUDED.rem_minutes,
        awake_minutes = EXCLUDED.awake_minutes,
        avg_heart_rate = EXCLUDED.avg_heart_rate,
        min_heart_rate = EXCLUDED.min_heart_rate,
        max_heart_rate = EXCLUDED.max_heart_rate,
        sleep_score = EXCLUDED.sleep_score,
        stage_items = EXCLUDED.stage_items
    `;
    count++;
    if (count % 10 === 0) console.log(`  ${count}/${records.length}`);
  }

  console.log(`Done! Imported ${count} records.`);
}

main().catch(console.error);
