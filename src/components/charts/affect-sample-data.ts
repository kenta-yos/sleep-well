// src/components/charts/affect-sample-data.ts
// ⚠️ プレビュー用のサンプル（ダミー）です。実データではありません。
// 値は I-PANAS-SF（短縮版・各サブスケール 5〜25）に合わせてあります。
// 日付と freshness（すっきり度）は 5/21〜6/19 の実ログ、pa/na は仮の流れ。
// 動作確認が済んだら import を実データ（dailyLogs由来）に差し替えてください。

export interface SampleAffectPoint {
  date: string;
  pa: number | null; // 5-25
  na: number | null; // 5-25
  freshness?: number; // 1-5
}

// 月前半は恋愛まわりのざわつきでNAやや高め → 後半は凪いでPA優位、という仮の流れ
export const SAMPLE_AFFECT: SampleAffectPoint[] = [
  { date: "2026-05-21", pa: 15, na: 13, freshness: 3 },
  { date: "2026-05-22", pa: 17, na: 11, freshness: 4 },
  { date: "2026-05-23", pa: 18, na: 10, freshness: 4 },
  { date: "2026-05-24", pa: 16, na: 12, freshness: 3 },
  { date: "2026-05-25", pa: 16, na: 12, freshness: 3 },
  { date: "2026-05-26", pa: 13, na: 14, freshness: 2 },
  { date: "2026-05-27", pa: 15, na: 13, freshness: 3 },
  { date: "2026-05-28", pa: 15, na: 13, freshness: 3 },
  { date: "2026-05-29", pa: 12, na: 15, freshness: 2 },
  { date: "2026-05-30", pa: 16, na: 11, freshness: 3 },
  { date: "2026-05-31", pa: 17, na: 10, freshness: 3 },
  { date: "2026-06-01", pa: 16, na: 12, freshness: 3 },
  { date: "2026-06-02", pa: 13, na: 14, freshness: 2 },
  { date: "2026-06-03", pa: 14, na: 13, freshness: 3 },
  { date: "2026-06-04", pa: 15, na: 13, freshness: 3 },
  { date: "2026-06-05", pa: 15, na: 13, freshness: 3 },
  { date: "2026-06-06", pa: 14, na: 14, freshness: 3 },
  { date: "2026-06-07", pa: 13, na: 13, freshness: 2 },
  { date: "2026-06-08", pa: 15, na: 12, freshness: 3 },
  { date: "2026-06-09", pa: 17, na: 10, freshness: 3 },
  { date: "2026-06-10", pa: 16, na: 11, freshness: 3 },
  { date: "2026-06-11", pa: 15, na: 12, freshness: 2 },
  { date: "2026-06-12", pa: 18, na: 9, freshness: 3 },
  { date: "2026-06-13", pa: 19, na: 8, freshness: 3 },
  { date: "2026-06-14", pa: 18, na: 8, freshness: 3 },
  { date: "2026-06-15", pa: 16, na: 10, freshness: 2 },
  { date: "2026-06-16", pa: 18, na: 9, freshness: 3 },
  { date: "2026-06-17", pa: 17, na: 9, freshness: 2 },
  { date: "2026-06-18", pa: 19, na: 8, freshness: 2 },
  { date: "2026-06-19", pa: 18, na: 9, freshness: 2 },
];

// PSS: 週1（日曜）想定の仮データ。22→16 と緩やかに低下する流れ
export const SAMPLE_PSS: { date: string; pss: number | null }[] = [
  { date: "2026-05-25", pss: 22 },
  { date: "2026-06-01", pss: 20 },
  { date: "2026-06-08", pss: 19 },
  { date: "2026-06-15", pss: 16 },
];
