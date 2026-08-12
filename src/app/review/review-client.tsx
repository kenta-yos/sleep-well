"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExportSection } from "@/components/export-section";

function getMonthOptions(): { label: string; year: number; month: number }[] {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const options: { label: string; year: number; month: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(jst.getFullYear(), jst.getMonth() - i, 1);
    options.push({
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }
  return options;
}

const STEPS = [
  { pct: 15, label: "データを取得中..." },
  { pct: 35, label: "睡眠データを分析中..." },
  { pct: 55, label: "ストレス傾向を分析中..." },
  { pct: 75, label: "日記を読み込み中..." },
  { pct: 90, label: "サマリーを生成中..." },
];

function useProgress(running: boolean) {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);

  const advance = useCallback(() => {
    if (stepRef.current < STEPS.length) {
      const step = STEPS[stepRef.current];
      setProgress(step.pct);
      setLabel(step.label);
      stepRef.current++;
      // Each step takes 3-6 seconds (randomized for natural feel)
      const delay = 3000 + Math.random() * 3000;
      timerRef.current = setTimeout(advance, delay);
    }
  }, []);

  useEffect(() => {
    if (running) {
      stepRef.current = 0;
      setProgress(0);
      setLabel("");
      // Start first step after a short delay
      timerRef.current = setTimeout(advance, 500);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stepRef.current > 0) {
        // Finish animation
        setProgress(100);
        setLabel("完了!");
        timerRef.current = setTimeout(() => {
          setProgress(0);
          setLabel("");
        }, 600);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, advance]);

  return { progress, label };
}

export function ReviewClient({
  initialContent,
  initialDate,
}: {
  initialContent: string | null;
  initialDate: string | null;
}) {
  const [content, setContent] = useState(initialContent);
  const [date, setDate] = useState(initialDate);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { progress, label } = useProgress(isPending);

  const [loading, setLoading] = useState(false);
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(
    () => monthOptions[1] ?? monthOptions[0]
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchExisting() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/review?year=${selectedMonth.year}&month=${selectedMonth.month}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setContent(data.content);
          setDate(data.date);
          setError(null);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchExisting();
    return () => { cancelled = true; };
  }, [selectedMonth]);

  async function handleGenerate() {
    setError(null);
    setIsPending(true);
    setContent("");
    setDate(
      `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-01`
    );
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedMonth.year,
          month: selectedMonth.month,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "エラーが発生しました");
        setContent(null);
        return;
      }

      // Stream response
      const reader = res.body?.getReader();
      if (!reader) {
        setError("ストリームを読み取れませんでした");
        return;
      }

      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setContent(result);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const idx = monthOptions.findIndex(
              (o) => o.year === selectedMonth.year && o.month === selectedMonth.month
            );
            if (idx < monthOptions.length - 1) setSelectedMonth(monthOptions[idx + 1]);
          }}
          disabled={
            isPending ||
            monthOptions.findIndex(
              (o) => o.year === selectedMonth.year && o.month === selectedMonth.month
            ) >= monthOptions.length - 1
          }
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface disabled:opacity-30"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative text-center">
          <p className="text-lg font-bold">{selectedMonth.label}</p>
          <select
            value={`${selectedMonth.year}-${selectedMonth.month}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              const opt = monthOptions.find((o) => o.year === y && o.month === m);
              if (opt) setSelectedMonth(opt);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {monthOptions.map((o) => (
              <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            const idx = monthOptions.findIndex(
              (o) => o.year === selectedMonth.year && o.month === selectedMonth.month
            );
            if (idx > 0) setSelectedMonth(monthOptions[idx - 1]);
          }}
          disabled={
            isPending ||
            monthOptions.findIndex(
              (o) => o.year === selectedMonth.year && o.month === selectedMonth.month
            ) <= 0
          }
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface disabled:opacity-30"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending
          ? `${progress}%`
          : `${selectedMonth.label}のサマリーを生成`}
      </button>

      {/* Progress bar */}
      {isPending && (
        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 p-4 text-sm text-accent-red">
          {error}
        </div>
      )}

      <ExportSection />

      {content && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          {date && (
            <p className="mb-3 text-xs text-text-muted">
              {date.split("-")[0]}年{parseInt(date.split("-")[1])}月分
            </p>
          )}
          <div className="prose-sm whitespace-pre-wrap text-sm leading-relaxed text-text">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
