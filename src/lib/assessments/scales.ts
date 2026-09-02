// lib/assessments/scales.ts
// -------------------------------------------------------------------
// 心理尺度の定義＋採点（フレームワーク非依存・サーバー/クライアント共用）
//
//   毎晩 : TDMS（二次元気分尺度・8項目）
//   ※ I-PANAS-SF / PANAS-20 / PSS-10 は過去データの読み取り用に残してある（下部）
//
// 出典:
//   TDMS       : 坂入洋右・徳田英次・川原正人・谷木龍男・征矢英昭 (2003)
//                「心理的覚醒度・快適度を測定する二次元気分尺度の開発」
//                筑波大学体育科学系紀要 26, 27-36
//                Sakairi, Nakatsuka & Shimizu (2013) Japanese Psychological
//                Research 55(4), 338-349
//   I-PANAS-SF : Thompson (2007)
//   PANAS      : Watson, Clark & Tellegen (1988) / 日本語版 cf. 佐藤・安田 (2001)
//   PSS-10     : Cohen, Kamarck & Mermelstein (1983) / 日本語版 cf. Mimura & Griffiths (2004)
//
// 2026-09 に毎晩の尺度を I-PANAS-SF から TDMS へ移行。理由は本文コメント参照。
// -------------------------------------------------------------------

// ===================================================================
//  TDMS 二次元気分尺度（毎晩・既定）
//
//  I-PANAS-SF から乗り換えた理由:
//  73日分の実データで全10項目の平均が1.04〜1.84（1-5尺度）に張り付いた。
//  単極の強度評定を合計する形式は、感情の起伏が穏やかな回答者では
//  必ず床に落ちる。TDMS は各次元を「正項目 − 負項目」で採点するため、
//  全項目0でも全項目5でも得点は0（中央）になり、構造的に床効果が出ない。
//  加えて覚醒度（興奮 ⇔ 眠気）の軸を持ち、これは睡眠と直結する。
//
//  注意: 原版の教示は「今の気分」を尋ねる瞬間尺度。本アプリは1日を
//  振り返って記録する運用なので教示を日単位に変えている。原版との
//  スコア互換性はその分だけ失われる。
// ===================================================================
export const TDMS_INSTRUCTION =
  "今日1日を振り返って、それぞれどの程度あてはまりましたか。";

/** 属する因子と符号。得点 = 正項目の合計 − 負項目の合計。 */
export type TdmsFactor = "vitality" | "stability";

export interface TdmsItem {
  id: string;
  word: string;
  factor: TdmsFactor;
  /** +1 なら加算、-1 なら減算 */
  sign: 1 | -1;
}

export const TDMS_ANCHORS = [
  { value: 0, label: "全くそうでない" },
  { value: 1, label: "" },
  { value: 2, label: "" },
  { value: 3, label: "" },
  { value: 4, label: "" },
  { value: 5, label: "非常にそう" },
] as const;

// 原版の提示順。因子ごとにまとめず、この並びのまま出すこと。
export const TDMS_ITEMS: TdmsItem[] = [
  { id: "tdms_calm", word: "落ち着いた", factor: "stability", sign: 1 },
  { id: "tdms_irritated", word: "イライラした", factor: "stability", sign: -1 },
  { id: "tdms_listless", word: "無気力な", factor: "vitality", sign: -1 },
  { id: "tdms_energetic", word: "活気にあふれた", factor: "vitality", sign: 1 },
  { id: "tdms_relaxed", word: "リラックスした", factor: "stability", sign: 1 },
  { id: "tdms_tense", word: "ピリピリした", factor: "stability", sign: -1 },
  { id: "tdms_sluggish", word: "だらけた", factor: "vitality", sign: -1 },
  { id: "tdms_lively", word: "イキイキした", factor: "vitality", sign: 1 },
];

export type TdmsAnswers = Record<string, 0 | 1 | 2 | 3 | 4 | 5>;

export interface TdmsResult {
  /** 活性度: +は「イキイキして活力がある」、−は「だるくて元気が出ない」 */
  vitality: number;
  /** 安定度: +は「ゆったりと落ち着いた」、−は「イライラして緊張した」 */
  stability: number;
  /** 快適度 = 活性度 + 安定度。+は「快適で明るい気分」 */
  pleasure: number;
  /** 覚醒度 = 活性度 − 安定度。+は「興奮して活発」、−は「眠くて不活発」 */
  arousal: number;
  complete: boolean;
}

export const TDMS_RANGE = {
  vitality: { min: -10, max: 10 },
  stability: { min: -10, max: 10 },
  pleasure: { min: -20, max: 20 },
  arousal: { min: -20, max: 20 },
} as const;

export function scoreTdms(answers: Partial<TdmsAnswers>): TdmsResult {
  let vitality = 0;
  let stability = 0;
  let answered = 0;
  for (const item of TDMS_ITEMS) {
    const v = answers[item.id];
    if (v == null) continue;
    answered++;
    if (item.factor === "vitality") vitality += item.sign * v;
    else stability += item.sign * v;
  }
  return {
    vitality,
    stability,
    pleasure: vitality + stability,
    arousal: vitality - stability,
    complete: answered === TDMS_ITEMS.length,
  };
}

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
//  I-PANAS-SF（〜2026-09 の毎晩尺度・過去データ読み取り用）
//  PA5 + NA5、各サブスケール 5〜25
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
//  PSS-10（〜2026-09 の月次尺度・過去データ表示用）
//
//  入力は 2026-09 に終了。半年で3回しか実施されず、得点は 10 / 9 / 11 と
//  ほぼ動かなかった。項目バンクと採点は消し、過去の得点を表示するための
//  区分ラベルだけ残す。列とデータはそのまま保持している。
//  出典: Cohen, Kamarck & Mermelstein (1983) / 日本語版 cf. Mimura & Griffiths (2004)
// ===================================================================
export type PssBand = "low" | "moderate" | "high";

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

export function pssBandLabel(score: number): string {
  return PSS_BAND_LABEL[pssBand(score)];
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
