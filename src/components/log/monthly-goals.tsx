"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMonthlyGoals } from "@/actions/log-actions";

const MAX_GOALS = 5;

/** Kept small on purpose: it sits above the diary every night. */
export function GoalsCard({ label, goals }: { label: string; goals: string[] }) {
  if (goals.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2">
      <p className="text-[11px] text-text-muted">🎯 {label}</p>
      <ul className="mt-1 space-y-0.5">
        {goals.map((g, i) => (
          <li key={i} className="text-xs leading-relaxed text-text">
            ・{g}
          </li>
        ))}
      </ul>
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function GoalsEditor({
  month,
  title,
  hint,
  initialGoals,
}: {
  month: string;
  title: string;
  hint: string;
  initialGoals: string[];
}) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [state, setState] = useState<SaveState>("idle");
  const lastSaved = useRef(JSON.stringify(initialGoals));

  async function save(next: string[]) {
    const cleaned = next.map((g) => g.trim()).filter(Boolean);
    const key = JSON.stringify(cleaned);
    if (key === lastSaved.current) return;
    setState("saving");
    try {
      await saveMonthlyGoals(month, cleaned);
      lastSaved.current = key;
      setState("saved");
      // Refreshes the card when the edited month is the one on display.
      router.refresh();
    } catch {
      setState("error");
    }
  }

  // A blank row at the end doubles as the "add" field.
  const rows = goals.length < MAX_GOALS ? [...goals, ""] : goals;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-text-muted">{title}</h2>
        <span className="text-[11px]">
          {state === "saving" && <span className="text-text-muted">保存中...</span>}
          {state === "saved" && <span className="text-accent-green">保存しました</span>}
          {state === "error" && <span className="text-accent-red">保存に失敗しました</span>}
        </span>
      </div>
      <p className="text-xs text-text-muted">{hint}</p>
      <div className="space-y-2">
        {rows.map((g, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={g}
              placeholder={i === goals.length ? "目標を追加" : ""}
              enterKeyHint="done"
              onChange={(e) => {
                const next = [...goals];
                next[i] = e.target.value;
                setGoals(next);
              }}
              onBlur={() => void save(goals)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            {i < goals.length && (
              <button
                type="button"
                aria-label="この目標を削除"
                onClick={() => {
                  const next = goals.filter((_, j) => j !== i);
                  setGoals(next);
                  void save(next);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted hover:bg-surface-hover"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
