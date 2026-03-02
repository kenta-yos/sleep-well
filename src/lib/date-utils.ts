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
