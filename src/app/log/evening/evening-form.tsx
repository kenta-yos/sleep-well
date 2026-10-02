"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveDiary } from "@/actions/log-actions";
import { nightStepHref } from "@/lib/checkin";
import { CheckinHeader } from "@/components/checkin/checkin-header";
import { Spinner } from "@/components/ui/spinner";

/** Entries run ~500 characters and are usually typed after midnight on a
 *  phone. A dropped tab used to lose the lot, so every keystroke goes to
 *  localStorage and the server save is debounced behind it. */
const AUTOSAVE_DELAY_MS = 2500;
const draftKey = (date: string) => `sleep-well:evening-draft:${date}`;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/** Night check-in step 3: the diary, full screen. */
export function DiaryForm({
  date,
  dateLabel,
  goals,
  initialNote,
}: {
  date: string;
  dateLabel: string;
  goals: string[];
  initialNote: string;
}) {
  const [note, setNote] = useState(initialNote);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [recoverable, setRecoverable] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const router = useRouter();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mutated only by handlers, never during render, so a debounced save always
  // reads the newest text.
  const latest = useRef(initialNote);

  // A draft that outlived its tab. Never overwrite the saved note silently:
  // show it and let the choice be explicit.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(draftKey(date));
      if (stored != null && stored !== initialNote) setRecoverable(stored);
    } catch {
      // Private mode or blocked storage. Autosave to the server still works.
    }
  }, [date, initialNote]);

  const persist = useCallback(
    async (text: string) => {
      setSaveState("saving");
      try {
        await saveDiary(date, text);
        setSaveState("saved");
        try {
          window.localStorage.removeItem(draftKey(date));
        } catch {
          // Nothing to clean up if storage is unavailable.
        }
        return true;
      } catch {
        // Keep the draft: it is the only remaining copy.
        setSaveState("error");
        return false;
      }
    },
    [date]
  );

  function update(text: string) {
    latest.current = text;
    setNote(text);
    setSaveState("dirty");
    try {
      window.localStorage.setItem(draftKey(date), text);
    } catch {
      // See above.
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void persist(latest.current);
    }, AUTOSAVE_DELAY_MS);
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

  async function finish() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setFinishing(true);
    // "idle": nothing typed. "saved": the debounce already landed.
    const ok =
      saveState === "idle" || saveState === "saved" ? true : await persist(latest.current);
    setFinishing(false);
    if (!ok) return;
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-3">
      <CheckinHeader
        backHref={nightStepHref("stress", date)}
        total={3}
        current={3}
        right={<SaveStatus state={saveState} />}
      />

      <div>
        <p className="text-[13px] text-text-muted">{dateLabel}の日記</p>
        {goals.length > 0 && (
          <p className="mt-0.5 text-xs text-text-muted/80">目標：{goals.join("／")}</p>
        )}
      </div>

      {recoverable != null && (
        <div className="space-y-2 rounded-xl border border-accent-yellow/40 bg-accent-yellow/10 p-3">
          <p className="text-xs">保存されなかった下書きが残っています（{recoverable.length}文字）。</p>
          <p className="max-h-20 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-text-muted">
            {recoverable}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                update(recoverable);
                setRecoverable(null);
              }}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
            >
              復元する
            </button>
            <button
              type="button"
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

      <textarea
        aria-label="日記"
        value={note}
        onChange={(e) => update(e.target.value)}
        placeholder="今日はどんな1日でしたか"
        className="w-full flex-1 resize-none bg-transparent text-[17px] leading-[1.9] text-text placeholder:text-text-muted/60 focus:outline-none"
      />

      <div className="flex items-center justify-between pb-2">
        <span className="text-xs tabular-nums text-text-muted">{note.length}文字</span>
        <button
          type="button"
          onClick={finish}
          disabled={finishing}
          className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {finishing && <Spinner className="text-white" />}
          おやすみ
        </button>
      </div>
    </div>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  switch (state) {
    case "dirty":
      return <span>未保存</span>;
    case "saving":
      return <span>保存中...</span>;
    case "saved":
      return <span className="text-accent-green">保存済み</span>;
    case "error":
      return <span className="text-accent-red">保存に失敗（端末に保持）</span>;
    default:
      return <span>日記</span>;
  }
}
