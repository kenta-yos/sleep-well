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

/** "2026-10-17" → "2026-10-01" */
export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/** "2026-10-17" → "2026-11-01" */
export function nextMonthStart(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/** Days left in the month after `date` (0 on the last day). */
export function daysLeftInMonth(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return lastDay - d;
}
