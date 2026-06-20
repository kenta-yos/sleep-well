// lib/assessments/scales.ts
// -------------------------------------------------------------------
// 心理尺度の定義＋採点（フレームワーク非依存・サーバー/クライアント共用）
//
//   毎晩 : I-PANAS-SF（PANAS短縮版・10項目）
//   週1  : PSS-10（知覚ストレス）
//   ※ フル版PANAS-20 も任意で残してある（下部）
//
// 出典:
//   I-PANAS-SF : Thompson (2007)
//   PANAS      : Watson, Clark & Tellegen (1988) / 日本語版 cf. 佐藤・安田 (2001)
//   PSS-10     : Cohen, Kamarck & Mermelstein (1983) / 日本語版 cf. Mimura & Griffiths (2004)
// -------------------------------------------------------------------

// ===================================================================
//  PANAS 共通
// ===================================================================
export type PanasItemType = "PA" | "NA";

export interface PanasItem {
  id: string;
  word: string; // UIに出すのはこれだけ
  type: PanasItemType;
}

export const PANAS_ANCHORS = [
  { value: 1, label: "ほとんど感じない" },
  { value: 2, label: "少し" },
  { value: 3, label: "まあまあ" },
  { value: 4, label: "かなり" },
  { value: 5, label: "非常に" },
] as const;

export type PanasAnswers = Record<string, 1 | 2 | 3 | 4 | 5>;

export interface PanasResult {
  positive: number;
  negative: number;
  balance: number; // positive - negative
  complete: boolean;
  /** 各サブスケールの理論レンジ（チャートの軸決めに使える） */
  range: { min: number; max: number };
}

/**
 * 汎用採点。items を差し替えれば短縮版でもフル版でも同じ関数で採れる。
 * 既定は毎晩用の I-PANAS-SF。
 */
export function scorePanas(
  answers: Partial<PanasAnswers>,
  items: PanasItem[] = IPANAS_ITEMS
): PanasResult {
  let positive = 0;
  let negative = 0;
  let answered = 0;
  for (const item of items) {
    const v = answers[item.id];
    if (v == null) continue;
    answered++;
    if (item.type === "PA") positive += v;
    else negative += v;
  }
  const perScale = items.length / 2; // PA項目数（=NA項目数）
  return {
    positive,
    negative,
    balance: positive - negative,
    complete: answered === items.length,
    range: { min: perScale * 1, max: perScale * 5 },
  };
}

// ===================================================================
//  I-PANAS-SF（毎晩・既定）— PA5 + NA5、各サブスケール 5〜25
// ===================================================================
export const IPANAS_INSTRUCTION = "今日1日、それぞれの気持ちをどの程度感じましたか。";

// Thompson(2007)の10項目。PA/NAはグループ化せず、この並びのまま提示すること。
export const IPANAS_ITEMS: PanasItem[] = [
  { id: "sf_upset", word: "気が動転した", type: "NA" },
  { id: "sf_hostile", word: "敵意を感じた", type: "NA" },
  { id: "sf_alert", word: "頭が冴えていた", type: "PA" },
  { id: "sf_ashamed", word: "情けなく感じた", type: "NA" },
  { id: "sf_inspired", word: "ひらめきがあった", type: "PA" },
  { id: "sf_nervous", word: "緊張した", type: "NA" },
  { id: "sf_determined", word: "やる気があった", type: "PA" },
  { id: "sf_attentive", word: "集中できた", type: "PA" },
  { id: "sf_afraid", word: "怖かった", type: "NA" },
  { id: "sf_active", word: "活気があった", type: "PA" },
];

// ===================================================================
//  PSS-10（週1）— 0〜40、高いほど知覚ストレスが大きい
// ===================================================================
export interface PssItem {
  id: string;
  text: string;
  reverse: boolean; // 逆転項目（ポジティブな対処）: score = 4 - raw
}

export const PSS_ANCHORS = [
  { value: 0, label: "まったくない" },
  { value: 1, label: "ほとんどない" },
  { value: 2, label: "ときどき" },
  { value: 3, label: "しばしば" },
  { value: 4, label: "とても頻繁に" },
] as const;

/** 標準は "この1ヶ月"（週1運用推奨）。毎晩運用なら "ここ数日" 等に差し替え可（比較互換は失われる）。 */
export function pssInstruction(windowLabel = "この1ヶ月"): string {
  return `${windowLabel}に、次のことをどのくらいの頻度で感じましたか。`;
}

export const PSS_ITEMS: PssItem[] = [
  { id: "pss1", text: "予期しないことが起きて動揺した", reverse: false },
  { id: "pss2", text: "人生の大切なことを自分でコントロールできないと感じた", reverse: false },
  { id: "pss3", text: "神経質になったり、強いストレスを感じた", reverse: false },
  { id: "pss4", text: "自分の問題にうまく対処できる自信があった", reverse: true },
  { id: "pss5", text: "物事が自分の思い通りに進んでいると感じた", reverse: true },
  { id: "pss6", text: "やるべきことすべてに対処しきれないと感じた", reverse: false },
  { id: "pss7", text: "生活上のいらだちをうまく抑えることができた", reverse: true },
  { id: "pss8", text: "物事をうまくこなせていると感じた", reverse: true },
  { id: "pss9", text: "自分にはどうにもできないことで腹が立った", reverse: false },
  { id: "pss10", text: "困難が積み重なり、乗り越えられないと感じた", reverse: false },
];

export type PssAnswers = Record<string, 0 | 1 | 2 | 3 | 4>;
export type PssBand = "low" | "moderate" | "high";

export interface PssResult {
  score: number; // 0-40
  band: PssBand;
  bandLabel: string;
  complete: boolean;
}

/** 目安（厳密な臨床カットオフではない）: 0-13低 / 14-26中 / 27-40高 */
export function pssBand(score: number): PssBand {
  if (score <= 13) return "low";
  if (score <= 26) return "moderate";
  return "high";
}

const PSS_BAND_LABEL: Record<PssBand, string> = {
  low: "低め",
  moderate: "中程度",
  high: "高め",
};

export function scorePss(answers: Partial<PssAnswers>): PssResult {
  let score = 0;
  let answered = 0;
  for (const item of PSS_ITEMS) {
    const raw = answers[item.id];
    if (raw == null) continue;
    answered++;
    score += item.reverse ? 4 - raw : raw;
  }
  const band = pssBand(score);
  return { score, band, bandLabel: PSS_BAND_LABEL[band], complete: answered === PSS_ITEMS.length };
}

// ===================================================================
//  （任意）フル版 PANAS-20 — 使う場合は scorePanas(answers, PANAS20_ITEMS)
//  各サブスケール 10〜50
// ===================================================================
export const PANAS20_ITEMS: PanasItem[] = [
  { id: "pa_interested", word: "関心がわいた", type: "PA" },
  { id: "na_distressed", word: "苦しかった", type: "NA" },
  { id: "pa_excited", word: "わくわくした", type: "PA" },
  { id: "na_upset", word: "気が動転した", type: "NA" },
  { id: "pa_strong", word: "力がみなぎった", type: "PA" },
  { id: "na_guilty", word: "罪悪感をおぼえた", type: "NA" },
  { id: "pa_enthusiastic", word: "熱中した", type: "PA" },
  { id: "na_scared", word: "おびえた", type: "NA" },
  { id: "pa_proud", word: "誇らしかった", type: "PA" },
  { id: "na_hostile", word: "敵意を感じた", type: "NA" },
  { id: "pa_alert", word: "頭が冴えていた", type: "PA" },
  { id: "na_irritable", word: "いらいらした", type: "NA" },
  { id: "pa_inspired", word: "ひらめきがあった", type: "PA" },
  { id: "na_ashamed", word: "情けなく感じた", type: "NA" },
  { id: "pa_determined", word: "やる気があった", type: "PA" },
  { id: "na_nervous", word: "緊張した", type: "NA" },
  { id: "pa_attentive", word: "集中できた", type: "PA" },
  { id: "na_jittery", word: "そわそわ落ち着かなかった", type: "NA" },
  { id: "pa_active", word: "活気があった", type: "PA" },
  { id: "na_afraid", word: "怖かった", type: "NA" },
];
