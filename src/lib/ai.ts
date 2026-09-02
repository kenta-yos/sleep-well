import Anthropic from "@anthropic-ai/sdk";
import type { SleepRecord, DailyLog } from "@/lib/db/schema";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function toJST(iso: string | Date | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");
}

function toJSTDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

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
    date: toJSTDate(r.date),
    totalMin: r.totalSleepMinutes,
    deepMin: r.deepMinutes,
    lightMin: r.lightMinutes,
    remMin: r.remMinutes,
    bedtime: toJST(r.bedtime as unknown as string),
    wakeTime: toJST(r.wakeTime as unknown as string),
    avgHR: r.avgHeartRate,
  }));

  const logSummary = dailyLogs.map((l) => ({
    date: toJSTDate(l.date),
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
    // TDMS（2026-09〜）。快適度と覚醒度は導出値だが、モデルに再計算させず
    // 明示的に渡す。
    ...(l.tdmsVitality != null && l.tdmsStability != null
      ? {
          tdms活性度: l.tdmsVitality,
          tdms安定度: l.tdmsStability,
          tdms快適度: l.tdmsVitality + l.tdmsStability,
          tdms覚醒度: l.tdmsVitality - l.tdmsStability,
        }
      : {}),
    // I-PANAS-SF（〜2026-09）。旧尺度なので TDMS とは直接比較できない。
    ...(l.panasPositive != null
      ? {
          panasPositive: l.panasPositive,
          panasNegative: l.panasNegative,
          panasBalance: (l.panasPositive ?? 0) - (l.panasNegative ?? 0),
        }
      : {}),
    ...(l.pssScore != null ? { pssScore: l.pssScore } : {}),
  }));

  return `## データ（すべて日本時間 JST）
睡眠データ:
${JSON.stringify(sleepSummary, null, 2)}

生活習慣ログ:
${JSON.stringify(logSummary, null, 2)}`;
}

export function generateMonthlySummary(
  sleepRecords: SleepRecord[],
  dailyLogs: DailyLog[],
  year: number,
  month: number,
  previousSummaries?: { date: string; content: string }[]
): string {
  const prevContext =
    previousSummaries && previousSummaries.length > 0
      ? `## 過去のサマリー（全期間）
以下は過去に生成された月次サマリーです（古い順）。今月の変化や成長、繰り返し現れるパターンに言及するための文脈として使ってください。直近の月ほど重要度が高いです。

${previousSummaries
  .map((s) => {
    const [y, m] = s.date.split("-");
    return `### ${y}年${parseInt(m)}月\n${s.content}`;
  })
  .join("\n\n")}

---
`
      : "";

  const prompt = `以下の${year}年${month}月の1ヶ月分の睡眠データと生活習慣ログを分析し、日本語で月次サマリーを書いてください。

${prevContext}## 構成（この順番で書いてください）
1. **睡眠の傾向** — 平均睡眠時間、深い睡眠・REMの割合、就寝/起床リズムの安定度、すっきり度の分布。週ごとの変化があれば触れる。日記から読み取れる睡眠に影響した出来事にも言及。${previousSummaries && previousSummaries.length > 0 ? "前月との比較も入れる。" : ""}
2. **ストレスと気分の傾向** — ストレスカテゴリ（仕事・恋愛・将来・友人等）の推移と、気分スコアの推移を合わせて分析。日記を踏まえて、具体的に何がストレスや感情の変化を引き起こしたかを詳しく。${previousSummaries && previousSummaries.length > 0 ? "過去数ヶ月で繰り返されているパターンがあれば指摘する。" : ""}

### 気分スコアの読み方
2026年9月に気分の尺度を入れ替えている。同じ「気分」でも別物なので、両者の数値を直接比較したり、連続した推移として扱ったりしないこと。
- tdms活性度 / tdms安定度（各 -10〜+10）: 2026年9月以降。活性度は＋が「イキイキして活力がある」、−が「だるくて元気が出ない」。安定度は＋が「ゆったりと落ち着いた」、−が「イライラして緊張した」。
- tdms快適度 = 活性度＋安定度、tdms覚醒度 = 活性度−安定度（各 -20〜+20）。覚醒度は＋が「興奮して活発」、−が「眠くて不活発」で、睡眠と結びつけて論じる価値がある。
- panasPositive / panasNegative（各 5-25）: 2026年9月より前。回答が低い側に偏っており、変動はほとんど情報を持たない。数値の細かい上下を根拠にした解釈はしないこと。
- pssScore（0-40）: 2026年9月に測定終了。データがある月のみ言及。
3. **${month}月のまとめ** — どんな1ヶ月だったかを日記ベースで詳しくまとめる。仕事、人間関係、プライベートの活動、心境の変化、印象的なエピソードなど、振り返りとして読み応えのある内容にする。${previousSummaries && previousSummaries.length > 0 ? "過去からの変化や成長にも触れる。" : ""}

${buildDataBlock(sleepRecords, dailyLogs)}

${TONE_INSTRUCTION}
- 800-1200字程度で、まとめパートは特に厚めに書く`;

  return prompt;
}

export function createSummaryStream(prompt: string) {
  return client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });
}
