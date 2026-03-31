import Anthropic from "@anthropic-ai/sdk";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TONE_INSTRUCTION = `## トーン
- カジュアルだけど馴れ馴れしくない、程よい距離感で
- 具体的な数値を使って説明する
- 日記の固有名詞はそのまま使ってOK
- Markdown見出し（##）を使って構造化する`;

function buildDataBlock(
  sleepRecords: SleepRecord[],
  dailyLogs: DailyLog[]
): string {
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

  return `## データ
睡眠データ:
${JSON.stringify(sleepSummary, null, 2)}

生活習慣ログ:
${JSON.stringify(logSummary, null, 2)}`;
}

export async function generateMonthlySummary(
  sleepRecords: SleepRecord[],
  dailyLogs: DailyLog[],
  year: number,
  month: number
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `以下の${year}年${month}月の1ヶ月分の睡眠データと生活習慣ログを分析し、日本語で月次サマリーを書いてください。

## 構成（この順番で書いてください）
1. **睡眠の傾向** — 平均睡眠時間、深い睡眠・REMの割合、就寝/起床リズムの安定度、すっきり度の分布。週ごとの変化があれば触れる。日記から読み取れる睡眠に影響した出来事にも言及。
2. **ストレスの傾向** — どのカテゴリ（仕事・恋愛・将来・友人等）が多かったか、月内での推移。日記を踏まえて、具体的に何がストレスだったのかを詳しく。
3. **${month}月のまとめ** — どんな1ヶ月だったかを日記ベースで詳しくまとめる。仕事、人間関係、プライベートの活動、心境の変化、印象的なエピソードなど、振り返りとして読み応えのある内容にする。

${buildDataBlock(sleepRecords, dailyLogs)}

${TONE_INSTRUCTION}
- 800-1200字程度で、まとめパートは特に厚めに書く`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "サマリーを生成できませんでした";
}
