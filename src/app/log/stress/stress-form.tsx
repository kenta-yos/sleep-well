"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveStressHabits } from "@/actions/log-actions";
import { nightStepHref } from "@/lib/checkin";
import {
  HABITS,
  HabitIcon,
  STRESS_CATEGORIES,
  STRESS_LEVELS,
  type HabitKey,
} from "@/components/log/habits";
import { Spinner } from "@/components/ui/spinner";
import { Toast, useToast } from "@/components/ui/toast";

type Values = { stressSources: Record<string, number> } & Record<HabitKey, boolean>;

/** Night check-in step 2. Nothing selected means no stress; tapping the
 *  selected level again clears it. */
export function StressForm({ date, initial }: { date: string; initial: Values }) {
  const [values, setValues] = useState<Values>(initial);
  const [isPending, startTransition] = useTransition();
  const { toast, showToast } = useToast();
  const router = useRouter();

  function setLevel(id: string, level: number) {
    setValues((v) => {
      const stressSources = { ...v.stressSources };
      if (stressSources[id] === level) delete stressSources[id];
      else stressSources[id] = level;
      return { ...v, stressSources };
    });
  }

  function handleNext() {
    startTransition(async () => {
      try {
        await saveStressHabits(date, values);
      } catch {
        showToast("保存に失敗しました", "error");
        return;
      }
      router.push(nightStepHref("diary", date));
    });
  }

  return (
    <div className="space-y-4">
      <Toast toast={toast} />

      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold">今日のストレス</h2>
        <span className="text-[11px] text-text-muted">もう一度タップで解除</span>
      </div>
      <div className="space-y-2">
        {STRESS_CATEGORIES.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 text-sm">{c.label}</span>
            <div className="grid grid-cols-[repeat(3,52px)] gap-1.5">
              {STRESS_LEVELS.map((l) => {
                const selected = values.stressSources[c.id] === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    aria-label={`${c.label} ${l.label}`}
                    aria-pressed={selected}
                    onClick={() => setLevel(c.id, l.value)}
                    className={`h-[38px] rounded-[10px] text-[13px] transition-colors ${
                      selected
                        ? "border-2 border-coral bg-coral-soft font-bold text-coral-text"
                        : "border border-border bg-surface text-text-muted"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h2 className="pt-2 text-[15px] font-bold">生活習慣</h2>
      <div className="grid grid-cols-4 gap-2">
        {HABITS.map((h) => {
          const on = values[h.key];
          return (
            <button
              key={h.key}
              type="button"
              aria-pressed={on}
              onClick={() => setValues((v) => ({ ...v, [h.key]: !v[h.key] }))}
              className={`flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl text-xs transition-colors ${
                on
                  ? "border-2 border-accent-green bg-accent-green-soft font-bold text-[#1e5e3e]"
                  : "border border-border bg-surface text-text-muted"
              }`}
            >
              <HabitIcon
                path={h.icon}
                className={`h-[22px] w-[22px] ${on ? "text-accent-green" : "text-text-muted"}`}
              />
              {h.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={isPending}
        className="!mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {isPending && <Spinner className="text-white" />}
        次へ（日記）
      </button>
    </div>
  );
}
