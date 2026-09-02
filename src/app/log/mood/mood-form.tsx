"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TDMS_ITEMS,
  TDMS_INSTRUCTION,
  TDMS_ANCHORS,
  TDMS_RANGE,
  scoreTdms,
  pssBandLabel,
  type TdmsAnswers,
} from "@/lib/assessments/scales";
import { saveMoodLog, clearMoodLog } from "@/actions/log-actions";
import { Spinner } from "@/components/ui/spinner";
import { Toast, useToast } from "@/components/ui/toast";
import { MoodGrid } from "@/components/log/mood-grid";

export function MoodForm({
  date,
  initialTdms,
  savedVitality,
  savedStability,
  savedPssScore,
  legacyPanasPositive,
  legacyPanasNegative,
}: {
  date: string;
  initialTdms: Record<string, number> | null;
  savedVitality: number | null;
  savedStability: number | null;
  /** PSS-10 input was retired in 2026-09; past scores still render. */
  savedPssScore: number | null;
  /** Days logged before 2026-09 hold I-PANAS-SF instead. Read-only. */
  legacyPanasPositive: number | null;
  legacyPanasNegative: number | null;
}) {
  const [tdmsAnswers, setTdmsAnswers] = useState<Partial<TdmsAnswers>>(
    (initialTdms as Partial<TdmsAnswers>) ?? {}
  );
  const [saved, setSaved] = useState(!!initialTdms);
  const [isPending, startTransition] = useTransition();
  const { toast, showToast } = useToast();
  const router = useRouter();

  const tdmsComplete = TDMS_ITEMS.every((item) => tdmsAnswers[item.id] != null);

  function handleSave() {
    if (!tdmsComplete) return;
    const tdms = scoreTdms(tdmsAnswers as TdmsAnswers);

    startTransition(async () => {
      try {
        await saveMoodLog(date, {
          tdmsAnswers: tdmsAnswers as Record<string, number>,
          tdmsVitality: tdms.vitality,
          tdmsStability: tdms.stability,
        });
      } catch {
        showToast("保存に失敗しました", "error");
        return;
      }
      setSaved(true);
      showToast("保存しました");
      router.refresh();
    });
  }

  if (saved && savedVitality != null && savedStability != null) {
    const pleasure = savedVitality + savedStability;
    const arousal = savedVitality - savedStability;

    return (
      <div className="space-y-4">
        <Toast toast={toast} />

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-sm font-medium">今日の気分</h2>

          <MoodGrid pleasure={pleasure} arousal={arousal} />

          <div className="grid grid-cols-2 gap-3 text-center">
            <Score
              label="活性度"
              hint={hint(savedVitality, "イキイキして活力がある", "だるくて元気が出ない")}
              value={savedVitality}
              max={TDMS_RANGE.vitality.max}
            />
            <Score
              label="安定度"
              hint={hint(savedStability, "ゆったりと落ち着いた", "イライラして緊張した")}
              value={savedStability}
              max={TDMS_RANGE.stability.max}
            />
            <Score
              label="快適度"
              hint={hint(pleasure, "快適で明るい気分", "不快で暗い気分")}
              value={pleasure}
              max={TDMS_RANGE.pleasure.max}
            />
            <Score
              label="覚醒度"
              hint={hint(arousal, "興奮して活発な気分", "眠くて不活発")}
              value={arousal}
              max={TDMS_RANGE.arousal.max}
            />
          </div>

          {savedPssScore != null && (
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <p className="text-[10px] text-text-muted">知覚ストレス（PSS-10）</p>
              <p className="text-sm font-semibold tabular-nums">
                {savedPssScore}
                <span className="ml-1 text-[10px] font-normal text-text-muted">
                  / 40・{pssBandLabel(savedPssScore)}
                </span>
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setSaved(false)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-hover"
        >
          回答を修正する
        </button>
        <button
          onClick={() => {
            startTransition(async () => {
              await clearMoodLog(date);
              setTdmsAnswers({});
              setSaved(false);
              router.refresh();
            });
          }}
          disabled={isPending}
          className="mx-auto block text-xs text-text-muted underline"
        >
          気分ログを取り消す
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {legacyPanasPositive != null && (
        <div className="rounded-xl border border-border bg-surface p-3 text-xs text-text-muted">
          この日は旧尺度（PANAS）で記録されています。ポジ {legacyPanasPositive}
          /25・ネガ {legacyPanasNegative}/25。保存すると新しい尺度の記録が加わります。
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">{TDMS_INSTRUCTION}</h2>
        <div className="space-y-3">
          {TDMS_ITEMS.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <p className="text-sm">{item.word}</p>
              <div className="flex gap-1">
                {TDMS_ANCHORS.map((anchor) => (
                  <button
                    key={anchor.value}
                    onClick={() =>
                      setTdmsAnswers((prev) => ({
                        ...prev,
                        [item.id]: anchor.value as 0 | 1 | 2 | 3 | 4 | 5,
                      }))
                    }
                    className={`flex-1 rounded-lg py-2 text-xs transition-colors ${
                      tdmsAnswers[item.id] === anchor.value
                        ? "bg-primary text-white"
                        : "border border-border bg-surface text-text-muted hover:text-text"
                    }`}
                  >
                    {anchor.value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-text-muted">
          <span>0 = {TDMS_ANCHORS[0].label}</span>
          <span>5 = {TDMS_ANCHORS[5].label}</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending || !tdmsComplete}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending && <Spinner className="text-white" />}
        {isPending ? "保存中..." : "保存する"}
      </button>

      {!tdmsComplete && (
        <p className="text-center text-xs text-text-muted">
          {Object.keys(tdmsAnswers).length}/{TDMS_ITEMS.length} 回答済み
        </p>
      )}
    </div>
  );
}

/** 0 は中立。どちらの極のラベルも当てはまらない。 */
function hint(value: number, positive: string, negative: string): string {
  if (value === 0) return "どちらでもない";
  return value > 0 ? positive : negative;
}

function Score({
  label,
  hint,
  value,
  max,
}: {
  label: string;
  hint: string;
  value: number;
  max: number;
}) {
  return (
    <div className="rounded-xl border border-border p-2">
      <p className="text-[10px] text-text-muted">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${
          value === 0
            ? "text-text-muted"
            : value > 0
              ? "text-accent-green"
              : "text-accent-red"
        }`}
      >
        {value > 0 ? "+" : ""}
        {value}
        <span className="ml-0.5 text-[10px] font-normal text-text-muted">
          / {max}
        </span>
      </p>
      <p className="text-[10px] leading-tight text-text-muted">{hint}</p>
    </div>
  );
}
