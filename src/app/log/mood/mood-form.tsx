"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IPANAS_ITEMS,
  IPANAS_INSTRUCTION,
  PANAS_ANCHORS,
  PSS_ITEMS,
  PSS_ANCHORS,
  pssInstruction,
  scorePanas,
  scorePss,
  type PanasAnswers,
  type PssAnswers,
} from "@/lib/assessments/scales";
import { saveMoodLog, clearMoodLog } from "@/actions/log-actions";
import { Spinner } from "@/components/ui/spinner";

function isSunday(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

export function MoodForm({
  date,
  initialPanas,
  initialPss,
  savedPositive,
  savedNegative,
  savedPssScore,
}: {
  date: string;
  initialPanas: Record<string, number> | null;
  initialPss: Record<string, number> | null;
  savedPositive: number | null;
  savedNegative: number | null;
  savedPssScore: number | null;
}) {
  const [panasAnswers, setPanasAnswers] = useState<Partial<PanasAnswers>>(
    (initialPanas as Partial<PanasAnswers>) ?? {}
  );
  const [pssAnswers, setPssAnswers] = useState<Partial<PssAnswers>>(
    (initialPss as Partial<PssAnswers>) ?? {}
  );
  const [saved, setSaved] = useState(!!initialPanas);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const showPss = isSunday(date);

  const panasComplete = IPANAS_ITEMS.every((item) => panasAnswers[item.id] != null);
  const pssComplete = PSS_ITEMS.every((item) => pssAnswers[item.id] != null);

  function handleSave() {
    if (!panasComplete) return;
    const panas = scorePanas(panasAnswers as PanasAnswers);
    const pss = showPss && pssComplete ? scorePss(pssAnswers as PssAnswers) : null;

    startTransition(async () => {
      await saveMoodLog(date, {
        panasAnswers: panasAnswers as Record<string, number>,
        panasPositive: panas.positive,
        panasNegative: panas.negative,
        ...(pss
          ? {
              pssAnswers: pssAnswers as Record<string, number>,
              pssScore: pss.score,
              pssWindow: "この1ヶ月",
            }
          : {}),
      });
      setSaved(true);
      router.refresh();
    });
  }

  // Show results when saved
  if (saved && savedPositive != null) {
    const balance = savedPositive - (savedNegative ?? 0);
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-medium">今日の気分スコア</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-text-muted">ポジティブ</p>
              <p className="text-lg font-semibold text-accent-green">
                {savedPositive}
              </p>
              <p className="text-[10px] text-text-muted">/ 25</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted">ネガティブ</p>
              <p className="text-lg font-semibold text-accent-red">
                {savedNegative}
              </p>
              <p className="text-[10px] text-text-muted">/ 25</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted">バランス</p>
              <p
                className={`text-lg font-semibold ${balance >= 0 ? "text-accent-green" : "text-accent-red"}`}
              >
                {balance > 0 ? "+" : ""}
                {balance}
              </p>
            </div>
          </div>
          {savedPssScore != null && (
            <div className="border-t border-border pt-3">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] text-text-muted">
                  知覚ストレス（PSS-10）
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {savedPssScore}{" "}
                  <span className="text-[10px] text-text-muted font-normal">
                    / 40・
                    {savedPssScore <= 13
                      ? "低め"
                      : savedPssScore <= 26
                        ? "中程度"
                        : "高め"}
                  </span>
                </p>
              </div>
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
              setPanasAnswers({});
              setPssAnswers({});
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
      {/* PANAS */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">
          {IPANAS_INSTRUCTION}
        </h2>
        <div className="space-y-3">
          {IPANAS_ITEMS.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <p className="text-sm">{item.word}</p>
              <div className="flex gap-1">
                {PANAS_ANCHORS.map((anchor) => (
                  <button
                    key={anchor.value}
                    onClick={() =>
                      setPanasAnswers((prev) => ({
                        ...prev,
                        [item.id]: anchor.value as 1 | 2 | 3 | 4 | 5,
                      }))
                    }
                    className={`flex-1 rounded-lg py-2 text-xs transition-colors ${
                      panasAnswers[item.id] === anchor.value
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
      </div>

      {/* PSS (Sunday only) */}
      {showPss && (
        <div className="space-y-3">
          <div className="rounded-xl bg-surface px-3 py-2">
            <h2 className="text-sm font-medium text-text-muted">
              週間ストレスチェック（日曜のみ）
            </h2>
            <p className="text-[11px] text-text-muted">
              {pssInstruction("この1ヶ月")}
            </p>
          </div>
          <div className="space-y-3">
            {PSS_ITEMS.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <p className="text-sm">{item.text}</p>
                <div className="flex gap-1">
                  {PSS_ANCHORS.map((anchor) => (
                    <button
                      key={anchor.value}
                      onClick={() =>
                        setPssAnswers((prev) => ({
                          ...prev,
                          [item.id]: anchor.value as 0 | 1 | 2 | 3 | 4,
                        }))
                      }
                      className={`flex-1 rounded-lg py-2 text-xs transition-colors ${
                        pssAnswers[item.id] === anchor.value
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
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isPending || !panasComplete || (showPss && !pssComplete)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending && <Spinner className="text-white" />}
        {isPending ? "保存中..." : "保存する"}
      </button>

      {!panasComplete && (
        <p className="text-center text-xs text-text-muted">
          すべての項目に回答してください
          （{Object.keys(panasAnswers).length}/{IPANAS_ITEMS.length}）
        </p>
      )}
    </div>
  );
}
