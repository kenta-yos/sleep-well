import Anthropic from "@anthropic-ai/sdk";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateWeeklyReview(
  sleepRecords: SleepRecord[],
  dailyLogs: DailyLog[]
): Promise<string> {
  const sleepSummary = sleepRecords.map((r) => ({
    date: r.date,
    sleepScore: r.sleepScore,
    totalMin: r.totalSleepMinutes,
    deepMin: r.deepMinutes,
    lightMin: r.lightMinutes,
    remMin: r.remMinutes,
    bedtime: r.bedtime,
    wakeTime: r.wakeTime,
    avgHR: r.avgHeartRate,
  }));

  const logSummary = dailyLogs.map((l) => ({
    date: l.date,
    freshness: l.freshnessScore,
    stress: l.stressScore,
    stressSources: l.stressSources,
    alcohol: l.alcohol,
    exercise: l.exercise,
    socializing: l.socializing,
    bathing: l.bathing,
    intenseFocus: l.intenseFocus,
    reading: l.reading,
    lateMeal: l.lateMeal,
    note: l.note,
  }));

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `あなたは睡眠コーチです。以下の1週間の睡眠データと生活習慣ログを分析し、日本語で簡潔なレビューを書いてください。

## 分析の観点
1. 睡眠の質の傾向（スコア、深い睡眠の割合、睡眠時間）
2. 生活習慣と睡眠の質の相関（飲酒、運動、交流、入浴、集中、読書、遅食、ストレスなど）
3. 就寝・起床時間の規則性
4. 具体的な改善提案（1-2個に絞る）

## データ
睡眠データ:
${JSON.stringify(sleepSummary, null, 2)}

生活習慣ログ:
${JSON.stringify(logSummary, null, 2)}

## 注意
- 口語的でフレンドリーなトーン
- データが少ない場合は正直に伝える
- 具体的な数値を使って説明する
- 200-400字程度で`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "レビューを生成できませんでした";
}
