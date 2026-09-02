"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StressSources } from "@/components/log/stress-sources";
import { HabitToggle } from "@/components/log/habit-toggle";
import { Spinner } from "@/components/ui/spinner";
import { Toast, useToast } from "@/components/ui/toast";
import { saveEveningLog, clearEveningLog } from "@/actions/log-actions";

interface FormData {
  stressSources: Record<string, number>;
  alcohol: boolean;
  exercise: boolean;
  socializing: boolean;
  bathing: boolean;
  intenseFocus: boolean;
  reading: boolean;
  lateMeal: boolean;
  note: string;
}

const EMPTY: FormData = {
  stressSources: {},
  alcohol: false,
  exercise: false,
  socializing: false,
  bathing: false,
  intenseFocus: false,
  reading: false,
  lateMeal: false,
  note: "",
};

const HABITS = [
  { key: "exercise", label: "運動", icon: "🏃" },
  { key: "alcohol", label: "飲酒", icon: "🍺" },
  { key: "socializing", label: "交流", icon: "👥" },
  { key: "bathing", label: "入浴", icon: "🛁" },
  { key: "intenseFocus", label: "集中", icon: "💻" },
  { key: "reading", label: "読書", icon: "📖" },
  { key: "lateMeal", label: "遅食", icon: "🍔" },
] as const;

/** Entries run ~500 characters and are usually typed after midnight on a
 *  phone. A dropped tab used to lose the lot, so every keystroke goes to
 *  localStorage and the server save is debounced behind it. */
const AUTOSAVE_DELAY_MS = 2500;
const draftKey = (date: string) => `sleep-well:evening-draft:${date}`;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function EveningForm({
  date,
  initialData,
}: {
  date: string;
  initialData: FormData | null;
}) {
  const [data, setData] = useState<FormData>(initialData ?? EMPTY);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [recoverable, setRecoverable] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast, showToast } = useToast();
  const router = useRouter();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mutated only by the handlers below, never during render, so a debounced
  // save always reads the newest form even mid-transition.
  const latest = useRef<FormData>(initialData ?? EMPTY);

  // A draft that outlived its tab. Never overwrite the saved note silently:
  // show it and let the choice be explicit.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(draftKey(date));
      if (stored != null && stored !== (initialData?.note ?? "")) {
        setRecoverable(stored);
      }
    } catch {
      // Private mode or blocked storage. Autosave to the server still works.
    }
  }, [date, initialData]);

  const persist = useCallback(
    async (next: FormData, announce = false) => {
      setSaveState("saving");
      try {
        await saveEveningLog(date, next);
        setSaveState("saved");
        if (announce) showToast("保存しました");
        try {
          window.localStorage.removeItem(draftKey(date));
        } catch {
          // Nothing to clean up if storage is unavailable.
        }
      } catch {
        // Keep the draft: it is the only remaining copy.
        setSaveState("error");
        if (announce) showToast("保存に失敗しました", "error");
      }
    },
    [date, showToast]
  );

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    setData(next);
    setSaveState("dirty");

    if (key === "note") {
      try {
        window.localStorage.setItem(draftKey(date), next.note);
      } catch {
        // See above.
      }
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist(latest.current), AUTOSAVE_DELAY_MS);
  }

  // Switching apps on a phone can freeze or discard the tab before the debounce
  // fires, so flush on the way out. pagehide covers the iOS back/forward cache,
  // which does not always emit visibilitychange.
  useEffect(() => {
    function flush() {
      if (!timerRef.current) return;
      clearTimeout(timerRef.current);
      timerRef.current = null;
      void persist(latest.current);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [persist]);

  function handleSave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    startTransition(() => {
      void persist(latest.current, true);
    });
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {recoverable != null && (
        <div className="space-y-2 rounded-xl border border-accent-yellow/40 bg-accent-yellow/10 p-3">
          <p className="text-xs text-text">
            保存されなかった下書きが残っています（{recoverable.length}文字）。
          </p>
          <p className="max-h-20 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-text-muted">
            {recoverable}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                update("note", recoverable);
                setRecoverable(null);
              }}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
            >
              復元する
            </button>
            <button
              onClick={() => {
                try {
                  window.localStorage.removeItem(draftKey(date));
                } catch {
                  // Nothing to clean up.
                }
                setRecoverable(null);
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted"
            >
              破棄する
            </button>
          </div>
        </div>
      )}

      {/* The diary comes first: it is the part that gets written every day. */}
      <div className="space-y-2">
        <div className="flex h-5 items-baseline justify-between">
          <h2 className="text-sm font-medium text-text-muted">日記</h2>
          <span className="text-[11px] tabular-nums text-text-muted">
            <SaveStatus state={saveState} />
            {data.note.length > 0 && (
              <span className="ml-2 opacity-60">{data.note.length}文字</span>
            )}
          </span>
        </div>
        <textarea
          value={data.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder="今日はどんな1日でしたか"
          className="min-h-[46vh] w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">
          ストレス（タップでスコア切替: −→低→中→高）
        </h2>
        <StressSources
          scores={data.stressSources}
          onChange={(sources) => update("stressSources", sources)}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">生活習慣</h2>
        <div className="flex flex-wrap gap-2">
          {HABITS.map((h) => (
            <HabitToggle
              key={h.key}
              label={h.label}
              icon={h.icon}
              checked={data[h.key]}
              onChange={(v) => update(h.key, v)}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending || saveState === "saving"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
      >
        {saveState === "saving" && <Spinner className="text-white" />}
        {saveState === "saving" ? "保存中..." : "保存する"}
      </button>

      <div className="flex items-center justify-center gap-3">
        {/* Autosave can create the row before this component re-renders with
            fresh initialData, so treat a completed save as "there is a log". */}
        {(initialData != null || saveState === "saved") && saveState !== "saving" && (
          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              startTransition(async () => {
                await clearEveningLog(date);
                try {
                  window.localStorage.removeItem(draftKey(date));
                } catch {
                  // Nothing to clean up.
                }
                latest.current = EMPTY;
                setData(EMPTY);
                setSaveState("idle");
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

function SaveStatus({ state }: { state: SaveState }) {
  switch (state) {
    case "dirty":
      return <span className="text-text-muted">未保存</span>;
    case "saving":
      return <span className="text-text-muted">保存中...</span>;
    case "saved":
      return <span className="text-accent-green">保存しました</span>;
    case "error":
      return <span className="text-accent-red">保存に失敗（下書きは端末に保持）</span>;
    default:
      return null;
  }
}
