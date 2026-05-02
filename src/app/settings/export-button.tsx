"use client";

import { useState } from "react";

export function ExportButton() {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const res = await fetch("/api/export");
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={state === "loading"}
      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-hover disabled:opacity-50"
    >
      {state === "loading"
        ? "読み込み中..."
        : state === "copied"
          ? "コピーしました！"
          : "全データをクリップボードにコピー"}
    </button>
  );
}
