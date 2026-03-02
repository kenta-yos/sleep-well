import type { SleepRecord, DailyLog } from "@/lib/db/schema";

export function generateNightlyTips(
  recentSleep: SleepRecord[],
  recentLogs: DailyLog[]
): string[] {
  const tips: string[] = [];
  if (recentSleep.length < 3) return tips;

  // 1. Bedtime variability check
  const bedtimeMinutes = recentSleep
    .filter((r) => r.bedtime)
    .map((r) => {
      const d = new Date(r.bedtime as unknown as string);
      let h = d.getUTCHours() + 9; // JST
      if (h >= 24) h -= 24;
      if (h < 12) h += 24; // normalize past midnight
      return h * 60 + d.getUTCMinutes();
    });

  if (bedtimeMinutes.length >= 3) {
    const avg =
      bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
    const variance =
      bedtimeMinutes.reduce((s, v) => s + (v - avg) ** 2, 0) /
      bedtimeMinutes.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 60) {
      tips.push(
        "就寝時間のばらつきが大きめです。一定の時間に寝ると睡眠の質が安定しやすくなります"
      );
    }
  }

  // 2. Late bedtime trend
  if (bedtimeMinutes.length >= 3) {
    const recentAvg =
      bedtimeMinutes.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    if (recentAvg > 24.5 * 60) {
      // After 0:30 AM
      tips.push(
        "最近、就寝時間が遅めの傾向です。30分早く寝ることを目指してみましょう"
      );
    }
  }

  // 3. Alcohol correlation
  const logsWithFreshness = recentLogs.filter((l) => l.freshnessScore != null);
  if (logsWithFreshness.length >= 3) {
    const logMap = new Map(recentLogs.map((l) => [l.date, l]));
    const withAlcohol: number[] = [];
    const withoutAlcohol: number[] = [];

    for (const log of logsWithFreshness) {
      const prevDate = new Date(log.date + "T00:00:00+09:00");
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = prevDate.toISOString().split("T")[0];
      const prevLog = logMap.get(prevStr);
      if (!prevLog) continue;

      if (prevLog.alcohol) {
        withAlcohol.push(log.freshnessScore!);
      } else {
        withoutAlcohol.push(log.freshnessScore!);
      }
    }

    if (withAlcohol.length >= 2 && withoutAlcohol.length >= 2) {
      const avgWith =
        withAlcohol.reduce((a, b) => a + b, 0) / withAlcohol.length;
      const avgWithout =
        withoutAlcohol.reduce((a, b) => a + b, 0) / withoutAlcohol.length;

      if (avgWithout - avgWith >= 0.5) {
        tips.push(
          `飲酒した翌朝のすっきり度が平均${avgWith.toFixed(1)}と、しない日(${avgWithout.toFixed(1)})より低い傾向です。今夜は控えめにすると明日が楽かもしれません`
        );
      }
    }
  }

  // 4. Screen time impact
  if (logsWithFreshness.length >= 3) {
    const logMap = new Map(recentLogs.map((l) => [l.date, l]));
    const withScreen: number[] = [];
    const withoutScreen: number[] = [];

    for (const log of logsWithFreshness) {
      const prevDate = new Date(log.date + "T00:00:00+09:00");
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = prevDate.toISOString().split("T")[0];
      const prevLog = logMap.get(prevStr);
      if (!prevLog) continue;

      if (prevLog.lateScreen) {
        withScreen.push(log.freshnessScore!);
      } else {
        withoutScreen.push(log.freshnessScore!);
      }
    }

    if (withScreen.length >= 2 && withoutScreen.length >= 2) {
      const avgWith =
        withScreen.reduce((a, b) => a + b, 0) / withScreen.length;
      const avgWithout =
        withoutScreen.reduce((a, b) => a + b, 0) / withoutScreen.length;

      if (avgWithout - avgWith >= 0.5) {
        tips.push(
          "就寝前のスマホ使用がすっきり度を下げている傾向があります。寝る1時間前にはスマホを置いてみましょう"
        );
      }
    }
  }

  // 5. Sleep duration check
  const avgDuration =
    recentSleep.reduce((s, r) => s + (r.totalSleepMinutes ?? 0), 0) /
    recentSleep.length;

  if (avgDuration < 360) {
    // Less than 6 hours
    tips.push(
      `直近の平均睡眠時間が${Math.floor(avgDuration / 60)}時間${Math.round(avgDuration % 60)}分です。7-8時間を目標にしてみましょう`
    );
  }

  // 6. Exercise encouragement
  const exerciseDays = recentLogs.filter((l) => l.exercise).length;
  if (recentLogs.length >= 5 && exerciseDays === 0) {
    tips.push(
      "最近運動の記録がありません。軽い運動でも睡眠の質が改善することがあります"
    );
  }

  // Limit to 2 tips
  return tips.slice(0, 2);
}
