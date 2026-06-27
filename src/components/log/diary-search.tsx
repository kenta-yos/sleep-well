"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Result {
  date: string;
  note: string;
}

export function DiarySearch() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"and" | "or">("and");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  function search(value: string, searchMode: "and" | "or") {
    if (timerRef.current) clearTimeout(timerRef.current);

    const keywords = value.trim().split(/\s+/).filter((k) => k.length > 0);
    if (keywords.length === 0 || value.trim().length < 2) {
      setResults(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(value.trim())}&mode=${searchMode}`
        );
        const data = await res.json();
        setResults(data.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleChange(value: string) {
    setQuery(value);
    search(value, mode);
  }

  function handleModeChange(newMode: "and" | "or") {
    setMode(newMode);
    search(query, newMode);
  }

  function highlight(text: string, q: string): React.ReactNode {
    const keywords = q.trim().split(/\s+/).filter((k) => k.length > 0);
    if (keywords.length === 0) return text;

    // Find earliest match for context window
    const lower = text.toLowerCase();
    let earliestIdx = text.length;
    for (const kw of keywords) {
      const idx = lower.indexOf(kw.toLowerCase());
      if (idx !== -1 && idx < earliestIdx) earliestIdx = idx;
    }
    if (earliestIdx === text.length) return text;

    const contextStart = Math.max(0, earliestIdx - 20);
    const contextEnd = Math.min(text.length, contextStart + 100);
    const snippet = text.slice(contextStart, contextEnd);
    const prefix = contextStart > 0 ? "..." : "";
    const suffix = contextEnd < text.length ? "..." : "";

    // Build regex to highlight all keywords
    const escaped = keywords.map((k) =>
      k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = snippet.split(regex);

    return (
      <>
        {prefix}
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-primary/30 text-text rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        {suffix}
      </>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="日記を検索..."
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {query.trim().includes(" ") && (
        <div className="flex gap-1">
          <button
            onClick={() => handleModeChange("and")}
            className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
              mode === "and"
                ? "bg-primary text-white"
                : "border border-border bg-surface text-text-muted"
            }`}
          >
            AND（すべて含む）
          </button>
          <button
            onClick={() => handleModeChange("or")}
            className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
              mode === "or"
                ? "bg-primary text-white"
                : "border border-border bg-surface text-text-muted"
            }`}
          >
            OR（いずれか含む）
          </button>
        </div>
      )}

      {loading && (
        <p className="text-xs text-text-muted">検索中...</p>
      )}

      {results != null && !loading && (
        <div className="space-y-1.5">
          {results.length === 0 ? (
            <p className="py-2 text-center text-xs text-text-muted">
              該当する日記がありません
            </p>
          ) : (
            <>
              <p className="text-[11px] text-text-muted">
                {results.length}件{results.length === 30 ? "+" : ""}
              </p>
              {results.map((r) => (
                <button
                  key={r.date}
                  onClick={() => router.push(`/log?date=${r.date}`)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                >
                  <span className="text-xs font-medium text-text-muted">
                    {r.date.slice(0, 4)}/{parseInt(r.date.slice(5, 7))}/{parseInt(r.date.slice(8))}
                  </span>
                  <p className="mt-0.5 text-xs text-text leading-relaxed">
                    {highlight(r.note, query)}
                  </p>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
