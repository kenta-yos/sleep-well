"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMonthlyGoals } from "@/actions/log-actions";

const MAX_GOALS = 5;

type SaveState = "idle" | "saving" | "saved" | "error";

function useGoals(month: string, initialGoals: string[]) {
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
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return { goals, setGoals, save, state };
}

function SaveStatus({ state }: { state: SaveState }) {
  return (
    <span className="text-[11px]">
      {state === "saving" && <span className="text-text-muted">保存中...</span>}
      {state === "saved" && <span className="text-accent-green">保存しました</span>}
      {state === "error" && <span className="text-accent-red">保存に失敗しました</span>}
    </span>
  );
}

/** Saves on blur. A blank row at the end doubles as the "add" field. */
function GoalInputs({
  goals,
  setGoals,
  save,
}: Pick<ReturnType<typeof useGoals>, "goals" | "setGoals" | "save">) {
  const rows = goals.length < MAX_GOALS ? [...goals, ""] : goals;
  return (
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
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
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
  );
}

/** This month's goals above the diary. Kept small on purpose since it shows
 *  every night; tapping 編集 turns it into inputs in place. */
export function GoalsCard({
  month,
  label,
  initialGoals,
}: {
  month: string;
  label: string;
  initialGoals: string[];
}) {
  const { goals, setGoals, save, state } = useGoals(month, initialGoals);
  const [editing, setEditing] = useState(false);
  const shown = goals.map((g) => g.trim()).filter(Boolean);

  function finish() {
    void save(goals);
    setGoals(shown);
    setEditing(false);
  }

  if (!editing && shown.length === 0) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full rounded-xl border border-dashed border-border px-3 py-3 text-left text-xs text-text-muted hover:bg-surface"
      >
        🎯 {label}を追加
      </button>
    );
  }

  if (!editing) {
    // The whole card is the edit target: small text links were too hard to hit.
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-left hover:bg-surface-hover"
      >
        <span className="flex items-center justify-between">
          <span className="text-[11px] text-text-muted">🎯 {label}</span>
          <span className="text-[11px] text-text-muted">タップで編集</span>
        </span>
        <ul className="mt-1 space-y-0.5">
          {shown.map((g, i) => (
            <li key={i} className="text-xs leading-relaxed text-text">
              ・{g}
            </li>
          ))}
        </ul>
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-primary/40 bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-muted">🎯 {label}</p>
        <SaveStatus state={state} />
      </div>
      <GoalInputs goals={goals} setGoals={setGoals} save={save} />
      <button
        type="button"
        onClick={finish}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
      >
        完了
      </button>
    </div>
  );
}

/** Next month's goals, offered at the bottom of the evening log at month-end. */
export function GoalsEditor({
  month,
  title,
  initialGoals,
}: {
  month: string;
  title: string;
  initialGoals: string[];
}) {
  const { goals, setGoals, save, state } = useGoals(month, initialGoals);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-text-muted">{title}</h2>
        <SaveStatus state={state} />
      </div>
      <p className="text-xs text-text-muted">
        来月の目標をいくつか決めておきましょう。来月の夜ログに毎日表示されます。
      </p>
      <GoalInputs goals={goals} setGoals={setGoals} save={save} />
    </div>
  );
}
