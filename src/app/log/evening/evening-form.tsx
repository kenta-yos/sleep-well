"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StressSources } from "@/components/log/stress-sources";
import { HabitToggle } from "@/components/log/habit-toggle";
import { Spinner } from "@/components/ui/spinner";
import { saveEveningLog, clearEveningLog } from "@/actions/log-actions";

const stressLevels = [
  { score: 1, emoji: "😌", label: "なし" },
  { score: 2, emoji: "😐", label: "軽め" },
  { score: 3, emoji: "😟", label: "そこそこ" },
  { score: 4, emoji: "😰", label: "高い" },
  { score: 5, emoji: "🤯", label: "最大" },
];

interface FormData {
  stressScore: number | null;
  stressSources: string[];
  alcohol: boolean;
  exercise: boolean;
  socializing: boolean;
  bathing: boolean;
  intenseFocus: boolean;
  reading: boolean;
  lateMeal: boolean;
  note: string;
}

export function EveningForm({
  date,
  initialData,
}: {
  date: string;
  initialData: FormData | null;
}) {
  const [data, setData] = useState<FormData>(
    initialData ?? {
      stressScore: null,
      stressSources: [],
      alcohol: false,
      exercise: false,
      socializing: false,
      bathing: false,
      intenseFocus: false,
      reading: false,
      lateMeal: false,
      note: "",
    }
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveEveningLog(date, data);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      {/* Stress Score */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">ストレス度</h2>
        <div className="flex items-center justify-between gap-2">
          {stressLevels.map(({ score, emoji, label }) => (
            <button
              key={score}
              type="button"
              onClick={() => update("stressScore", score)}
              className={`flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all ${
                data.stressScore === score
                  ? "border-accent-purple bg-accent-purple/15 scale-110"
                  : "border-border bg-surface hover:border-accent-purple/50"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[10px] text-text-muted">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stress Sources */}
      {data.stressScore != null && data.stressScore >= 2 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-text-muted">
            ストレスの原因
          </h2>
          <StressSources
            selected={data.stressSources}
            onChange={(sources) => update("stressSources", sources)}
          />
        </div>
      )}

      {/* Habits */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">生活習慣</h2>
        <div className="flex flex-wrap gap-2">
          <HabitToggle
            label="運動"
            icon="🏃"
            checked={data.exercise}
            onChange={(v) => update("exercise", v)}
          />
          <HabitToggle
            label="飲酒"
            icon="🍺"
            checked={data.alcohol}
            onChange={(v) => update("alcohol", v)}
          />
          <HabitToggle
            label="交流"
            icon="👥"
            checked={data.socializing}
            onChange={(v) => update("socializing", v)}
          />
          <HabitToggle
            label="入浴"
            icon="🛁"
            checked={data.bathing}
            onChange={(v) => update("bathing", v)}
          />
          <HabitToggle
            label="集中"
            icon="💻"
            checked={data.intenseFocus}
            onChange={(v) => update("intenseFocus", v)}
          />
          <HabitToggle
            label="読書"
            icon="📖"
            checked={data.reading}
            onChange={(v) => update("reading", v)}
          />
          <HabitToggle
            label="遅食"
            icon="🍔"
            checked={data.lateMeal}
            onChange={(v) => update("lateMeal", v)}
          />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-text-muted">メモ</h2>
        <textarea
          value={data.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder="自由記入..."
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
      >
        {isPending && <Spinner className="text-white" />}
        {isPending ? "保存中..." : "保存する"}
      </button>

      <div className="flex items-center justify-center gap-3">
        {saved && !isPending && (
          <p className="text-sm text-accent-green">保存しました</p>
        )}
        {initialData && !isPending && (
          <button
            onClick={() => {
              startTransition(async () => {
                await clearEveningLog(date);
                setData({
                  stressScore: null,
                  stressSources: [],
                  alcohol: false,
                  exercise: false,
                  socializing: false,
                  bathing: false,
                  intenseFocus: false,
                  reading: false,
                  lateMeal: false,
                  note: "",
                });
                setSaved(false);
                router.refresh();
              });
            }}
            className="text-xs text-text-muted underline"
          >
            夜ログを取り消す
          </button>
        )}
      </div>
    </div>
  );
}
