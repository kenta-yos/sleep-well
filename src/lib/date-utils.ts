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

export function getDaysAgoJST(days: number): string {
  const now = new Date();
  const target = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  target.setDate(target.getDate() - days);
  return target.toISOString().split("T")[0];
}

/** Current hour in JST (0-23). Works correctly on both server (UTC) and client. */
export function getJSTHour(): number {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.getUTCHours();
}

/** Yesterday's date string in JST. Pure arithmetic, no TZ bugs. */
export function getYesterdayDateStr(): string {
  const today = getTodayJST();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
