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

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for mobile Safari
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    }
  }

  async function handleExport() {
    setState("loading");
    try {
      // Safari: create ClipboardItem synchronously within user gesture
      if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard?.write
      ) {
        const item = new ClipboardItem({
          "text/plain": fetch(`/api/export?from=${from}&to=${to}`)
            .then((res) => res.text())
            .then((text) => new Blob([text], { type: "text/plain" })),
        });
        await navigator.clipboard.write([item]);
      } else {
        const res = await fetch(`/api/export?from=${from}&to=${to}`);
        const text = await res.text();
        await copyToClipboard(text);
      }
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
