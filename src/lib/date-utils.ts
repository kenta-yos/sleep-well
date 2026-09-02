export function getTodayJST(): string {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

export function getYesterdayJST(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

export function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+09:00");
  return d.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

/** Current hour in JST (0-23). Works correctly on both server (UTC) and client. */
export function getJSTHour(): number {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.getUTCHours();
}

/** "Effective today" — 0:00〜3:59 JST is still yesterday (same sleep cycle). */
export function getEffectiveToday(): string {
  return getJSTHour() < 4 ? getYesterdayJST() : getTodayJST();
}

