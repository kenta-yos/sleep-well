"use client";

import { useState } from "react";

export function ExportButton() {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  async function handleExport() {
    setState("loading");
    try {
      if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard?.write
      ) {
        const item = new ClipboardItem({
          "text/plain": fetch("/api/export")
            .then((res) => res.text())
            .then((text) => new Blob([text], { type: "text/plain" })),
        });
        await navigator.clipboard.write([item]);
      } else {
        const res = await fetch("/api/export");
        const text = await res.text();
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
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
