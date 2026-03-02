import Papa from "papaparse";
import type { NewSleepRecord } from "./db/schema";

interface AggregatedRow {
  Uid: string;
  Sid: string;
  Tag: string;
  Key: string;
  Time: string;
  Value: string;
  UpdateTime: string;
}

interface DetailedRow {
  Uid: string;
  Sid: string;
  Key: string;
  Time: string;
  Value: string;
  UpdateTime: string;
}

interface SleepData {
  sleep_score: number;
  total_duration: number;
  sleep_deep_duration: number;
  sleep_light_duration: number;
  sleep_rem_duration: number;
  sleep_awake_duration: number;
  avg_hr: number;
  min_hr: number;
  max_hr: number;
  segment_details?: Array<{
    bedtime: number;
    wake_up_time: number;
    timezone: number;
    duration: number;
  }>;
}

interface DetailedSleepData {
  bedtime: number;
  wake_up_time: number;
  timezone: number;
  duration: number;
  sleep_deep_duration: number;
  sleep_light_duration: number;
  sleep_rem_duration: number;
  sleep_awake_duration: number;
  avg_hr: number;
  min_hr: number;
  max_hr: number;
  items?: Array<{ state: number; start_time: number; end_time: number }>;
}

function unixToJSTDate(unixSeconds: number): string {
  // Convert to JST (UTC+9) and return YYYY-MM-DD
  const d = new Date((unixSeconds + 9 * 3600) * 1000);
  return d.toISOString().split("T")[0];
}

function unixToTimestamp(unixSeconds: number): Date {
  return new Date(unixSeconds * 1000);
}

export function parseAggregatedCSV(csvText: string): NewSleepRecord[] {
  const result = Papa.parse<AggregatedRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const records: NewSleepRecord[] = [];

  for (const row of result.data) {
    // Only process sleep daily reports from 'default' Sid
    if (row.Tag !== "daily_report" || row.Key !== "sleep") continue;
    if (row.Sid !== "default") continue;

    let data: SleepData;
    try {
      data = JSON.parse(row.Value);
    } catch {
      continue;
    }

    // Skip nap-only records (no long sleep)
    if (data.total_duration < 120) continue;

    // The Time field is the date epoch (midnight UTC for that day)
    // For sleep, the date represents the wake-up day in JST
    const dateEpoch = parseInt(row.Time, 10);
    const date = unixToJSTDate(dateEpoch);

    // Extract bedtime and wake time from segment_details
    let bedtime: Date | undefined;
    let wakeTime: Date | undefined;

    const mainSegment = data.segment_details?.find(
      (s) => s.duration === data.total_duration
    ) ?? data.segment_details?.[0];

    if (mainSegment) {
      bedtime = unixToTimestamp(mainSegment.bedtime);
      wakeTime = unixToTimestamp(mainSegment.wake_up_time);
    }

    records.push({
      date,
      bedtime: bedtime ?? null,
      wakeTime: wakeTime ?? null,
      totalSleepMinutes: data.total_duration,
      deepMinutes: data.sleep_deep_duration,
      lightMinutes: data.sleep_light_duration,
      remMinutes: data.sleep_rem_duration,
      awakeMinutes: data.sleep_awake_duration,
      avgHeartRate: data.avg_hr,
      minHeartRate: data.min_hr,
      maxHeartRate: data.max_hr,
      sleepScore: data.sleep_score,
      stageItems: null,
    });
  }

  return records;
}

export function parseDetailedCSV(csvText: string): Map<string, unknown[]> {
  const result = Papa.parse<DetailedRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  // Map of date -> stage items
  const stageMap = new Map<string, unknown[]>();

  for (const row of result.data) {
    if (row.Key !== "sleep") continue;

    let data: DetailedSleepData;
    try {
      data = JSON.parse(row.Value);
    } catch {
      continue;
    }

    if (!data.items || data.items.length === 0) continue;
    if (data.duration < 120) continue;

    // Wake up time determines the date
    const date = unixToJSTDate(data.wake_up_time);

    // Only keep the longest sleep session per date
    const existing = stageMap.get(date);
    if (!existing || data.items.length > (existing as unknown[]).length) {
      stageMap.set(date, data.items);
    }
  }

  return stageMap;
}

export function mergeRecordsWithStages(
  records: NewSleepRecord[],
  stageMap: Map<string, unknown[]>
): NewSleepRecord[] {
  return records.map((record) => {
    const stages = stageMap.get(record.date);
    return {
      ...record,
      stageItems: stages ?? null,
    };
  });
}
