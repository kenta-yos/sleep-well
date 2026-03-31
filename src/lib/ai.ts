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
1. 睡眠の質の傾向（深い睡眠の割合、睡眠時間）
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

export async function generateMonthlySummary(
  sleepRecords: SleepRecord[],
  dailyLogs: DailyLog[],
  year: number,
  month: number
): Promise<string> {
  const sleepSummary = sleepRecords.map((r) => ({
    date: r.date,
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
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `あなたは睡眠コーチです。以下の${year}年${month}月の1ヶ月分の睡眠データと生活習慣ログを分析し、日本語で月次サマリーを書いてください。

## 分析の観点
1. 睡眠の全体傾向（平均睡眠時間、深い睡眠・REM睡眠の割合、週ごとの変化）
2. すっきり度の傾向（平均、特に良かった日・悪かった日の共通点）
3. ストレスの傾向（どのカテゴリが多いか、月内での変化）
4. 生活習慣の傾向（運動・飲酒・交流の頻度と睡眠への影響）
5. 日記から読み取れる心理的な傾向や変化
6. 来月に向けた具体的なアドバイス（2-3個）

## データ
睡眠データ:
${JSON.stringify(sleepSummary, null, 2)}

生活習慣ログ:
${JSON.stringify(logSummary, null, 2)}

## 注意
- 口語的でフレンドリーなトーン
- 具体的な数値を使って説明する
- 日記の内容にも触れつつ、プライバシーに配慮する（固有名詞は使わず「友人」「同僚」等で表現）
- 500-800字程度で
- Markdown見出し（##）を使って構造化する`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "サマリーを生成できませんでした";
}
