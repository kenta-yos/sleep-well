/**
 * Utilities for sleep data wizard - time conversions & calculations.
 */

/** Convert "HH:MM" + date string to a JST Date object. Bedtime before 12:00 is treated as previous day's night. */
export function timeToTimestamp(
  date: string,
  time: string,
  isBedtime: boolean
): Date {
  const [h, m] = time.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);

  // For bedtime: hours >= 12 means the previous calendar day (e.g. 23:00 on 2024-03-01 = 2024-02-29 23:00)
  // For wake time: always the date itself
  if (isBedtime) {
    if (h >= 12) {
      // Previous calendar day at this hour in JST
      const prev = new Date(y, mo - 1, d - 1);
      return new Date(
        `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}T${time}:00+09:00`
      );
    }
    // Early morning bedtime (0-11) = same calendar day as the date label but technically the sleep night
    return new Date(`${date}T${time}:00+09:00`);
  }

  // Wake time: always the date itself
  return new Date(`${date}T${time}:00+09:00`);
}

/** Convert a timestamp (Date or string) to "HH:MM" in JST */
export function timestampToTime(ts: Date | string | null): string | null {
  if (!ts) return null;
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
}

/** Calculate time in bed from bedtime/wake strings (minutes) */
export function timeInBedMinutes(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  // If bedtime is in the evening and wake is morning, add 24h to wake
  if (wakeMins <= bedMins) {
    wakeMins += 24 * 60;
  }
  return wakeMins - bedMins;
}

/** Format minutes as "Xh Ym" */
export function formatMinutesAsHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/** Clamp a value between min and max, snapping to step */
export function clampStep(
  value: number,
  min: number,
  max: number,
  step: number
): number {
  const clamped = Math.min(max, Math.max(min, value));
  return Math.round(clamped / step) * step;
}

/** Default bedtime/wake estimates based on date */
export function getDefaultTimes() {
  return {
    bedtime: "23:30",
    wakeTime: "07:00",
    totalSleepMinutes: 420, // 7h
    deepMinutes: 90,
    lightMinutes: 210,
    remMinutes: 90,
    avgHeartRate: 60,
  };
}
