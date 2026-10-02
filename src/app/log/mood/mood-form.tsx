"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TDMS_ITEMS,
  TDMS_INSTRUCTION,
  TDMS_ANCHORS,
  scoreTdms,
  type TdmsAnswers,
} from "@/lib/assessments/scales";
import { saveMoodLog, clearMoodLog } from "@/actions/log-actions";
import { nightStepHref } from "@/lib/checkin";
import { Spinner } from "@/components/ui/spinner";
import { Toast, useToast } from "@/components/ui/toast";

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Night check-in step 1: all eight TDMS items on one screen. */
export function MoodForm({
  date,
  initialTdms,
  legacyPanasPositive,
  legacyPanasNegative,
}: {
  date: string;
  initialTdms: Record<string, number> | null;
  /** Days logged before 2026-09 hold I-PANAS-SF instead. Read-only. */
  legacyPanasPositive: number | null;
  legacyPanasNegative: number | null;
}) {
  const [answers, setAnswers] = useState<Partial<TdmsAnswers>>(
    (initialTdms as Partial<TdmsAnswers>) ?? {}
  );
  const [isPending, startTransition] = useTransition();
  const { toast, showToast } = useToast();
  const router = useRouter();

  const answered = TDMS_ITEMS.filter((item) => answers[item.id] != null).length;
  const complete = answered === TDMS_ITEMS.length;
  const score = complete ? scoreTdms(answers as TdmsAnswers) : null;
  const next = nightStepHref("stress", date);

  function handleNext() {
    if (!score) return;
    startTransition(async () => {
      try {
        await saveMoodLog(date, {
          tdmsAnswers: answers as Record<string, number>,
          tdmsVitality: score.vitality,
          tdmsStability: score.stability,
        });
      } catch {
        showToast("保存に失敗しました", "error");
        return;
      }
      router.push(next);
    });
  }

  return (
    <div className="space-y-4">
      <Toast toast={toast} />

      {legacyPanasPositive != null && (
        <div className="rounded-xl border border-border bg-surface p-3 text-xs text-text-muted">
          この日は旧尺度（PANAS）で記録されています。ポジ {legacyPanasPositive}
          /25・ネガ {legacyPanasNegative}/25。保存すると新しい尺度の記録が加わります。
        </div>
      )}

      <p className="text-sm leading-relaxed">{TDMS_INSTRUCTION}</p>

      <div className="flex justify-end text-[10px] text-text-muted">
        <span className="flex w-[224px] justify-between">
          <span>{TDMS_ANCHORS[0].label}</span>
          <span>{TDMS_ANCHORS[5].label}</span>
        </span>
      </div>

      <div className="space-y-2.5">
        {TDMS_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 text-sm">{item.word}</span>
            <div className="grid grid-cols-[repeat(6,34px)] gap-1">
              {TDMS_ANCHORS.map((anchor) => {
                const selected = answers[item.id] === anchor.value;
                return (
                  <button
                    key={anchor.value}
                    type="button"
                    aria-label={`${item.word} ${anchor.value}`}
                    aria-pressed={selected}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [item.id]: anchor.value as 0 | 1 | 2 | 3 | 4 | 5,
                      }))
                    }
                    className={`h-10 rounded-[10px] text-sm tabular-nums transition-colors ${
                      selected
                        ? "border-2 border-primary bg-primary-soft font-bold text-text"
                        : "border border-border bg-surface text-text-muted"
                    }`}
                  >
                    {anchor.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-around rounded-2xl border border-border bg-surface px-3 py-3 text-center">
        <Summary label="快適度" value={score ? signed(score.pleasure) : "—"} />
        <Summary label="覚醒度" value={score ? signed(score.arousal) : "—"} />
        <Summary label="回答" value={`${answered}/${TDMS_ITEMS.length}`} />
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={isPending || !complete}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {isPending && <Spinner className="text-white" />}
        {complete ? "次へ（ストレス・習慣）" : `あと${TDMS_ITEMS.length - answered}問`}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
        <Link href={next} className="underline">
          気分はスキップ
        </Link>
        {initialTdms && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await clearMoodLog(date);
                setAnswers({});
                router.refresh();
              })
            }
            className="underline"
          >
            気分の記録を消す
          </button>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
