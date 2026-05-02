"use client";

import { useState } from "react";

function getDefaultFrom(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jst.setDate(jst.getDate() - 30);
  return jst.toISOString().split("T")[0];
}

function getDefaultTo(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split("T")[0];
}

export function ExportSection() {
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(getDefaultTo);
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const res = await fetch(`/api/export?from=${from}&to=${to}`);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">データエクスポート</h2>
      <p className="text-[11px] text-text-muted">
        期間を指定してクリップボードにコピー。Claudeに貼って分析できます。
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <button
        onClick={handleExport}
        disabled={state === "loading"}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-hover disabled:opacity-50"
      >
        {state === "loading"
          ? "読み込み中..."
          : state === "copied"
            ? "コピーしました！"
            : "クリップボードにコピー"}
      </button>
    </div>
  );
}
