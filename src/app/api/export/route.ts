import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sleepRecords, dailyLogs } from "@/lib/db/schema";
import { asc, gte, lte, and } from "drizzle-orm";

function toJST(iso: string | Date | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");
}

const stressLabels: Record<string, string> = {
  work: "仕事",
  friends: "友人関係",
  romance: "恋愛",
  health: "体調・健康",
  money: "金銭",
  future: "将来・生き方",
  other: "その他",
};

const behaviorLabels: [string, string][] = [
  ["alcohol", "飲酒"],
  ["exercise", "運動"],
  ["socializing", "交流"],
  ["bathing", "入浴"],
  ["intenseFocus", "集中作業"],
  ["reading", "読書"],
  ["lateMeal", "遅い食事"],
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const sleepWhere =
    from && to
      ? and(gte(sleepRecords.date, from), lte(sleepRecords.date, to))
      : from
        ? gte(sleepRecords.date, from)
        : to
          ? lte(sleepRecords.date, to)
          : undefined;

  const logWhere =
    from && to
      ? and(gte(dailyLogs.date, from), lte(dailyLogs.date, to))
      : from
        ? gte(dailyLogs.date, from)
        : to
          ? lte(dailyLogs.date, to)
          : undefined;

  const sleep = await db
    .select()
    .from(sleepRecords)
    .where(sleepWhere)
    .orderBy(asc(sleepRecords.date));

  const logs = await db
    .select()
    .from(dailyLogs)
    .where(logWhere)
    .orderBy(asc(dailyLogs.date));

  const logMap = new Map(logs.map((l) => [l.date, l]));
  const allDates = new Set([...sleep.map((s) => s.date), ...logs.map((l) => l.date)]);
  const sortedDates = [...allDates].sort();

  const sleepMap = new Map(sleep.map((s) => [s.date, s]));

  const lines: string[] = [
    "# Sleep Well データエクスポート",
    `期間: ${sortedDates[0]} 〜 ${sortedDates[sortedDates.length - 1]}（${sortedDates.length}日分）`,
    "",
  ];

  for (const date of sortedDates) {
    const s = sleepMap.get(date);
    const l = logMap.get(date);

    lines.push(`## ${date}`);

    if (s) {
      const totalH = s.totalSleepMinutes ? `${Math.floor(s.totalSleepMinutes / 60)}h${s.totalSleepMinutes % 60}m` : "—";
      lines.push(`睡眠: ${totalH}（深い${s.deepMinutes ?? 0}分 / 浅い${s.lightMinutes ?? 0}分 / REM${s.remMinutes ?? 0}分 / 覚醒${s.awakeMinutes ?? 0}分）`);
      lines.push(`就寝: ${toJST(s.bedtime as unknown as string) ?? "—"} → 起床: ${toJST(s.wakeTime as unknown as string) ?? "—"}`);
      if (s.avgHeartRate) lines.push(`心拍: 平均${s.avgHeartRate} / 最低${s.minHeartRate ?? "—"} / 最高${s.maxHeartRate ?? "—"}`);
    }

    if (l) {
      if (l.freshnessScore) lines.push(`すっきり度: ${l.freshnessScore}/5`);

      const sources = l.stressSources as Record<string, number> | null;
      if (sources) {
        const active = Object.entries(sources)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `${stressLabels[k] ?? k}:${v}`)
          .join(" / ");
        if (active) lines.push(`ストレス: ${active}`);
      }

      const tags = behaviorLabels
        .filter(([key]) => (l as Record<string, unknown>)[key] === true)
        .map(([, label]) => label);
      if (tags.length > 0) lines.push(`行動: ${tags.join("・")}`);

      if (l.note) lines.push(`日記: ${l.note}`);
    }

    lines.push("");
  }

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
