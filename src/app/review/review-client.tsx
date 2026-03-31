"use client";

import { useState, useTransition } from "react";
import { generateMonthlyReviewAction } from "@/actions/ai-actions";

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
  const [isPending, startTransition] = useTransition();

  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(
    () => monthOptions[1] ?? monthOptions[0]
  );

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateMonthlyReviewAction(
        selectedMonth.year,
        selectedMonth.month
      );
      if (result.error) {
        setError(result.error);
      } else {
        setContent(result.content);
        setDate(
          `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-01`
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <select
        value={`${selectedMonth.year}-${selectedMonth.month}`}
        onChange={(e) => {
          const [y, m] = e.target.value.split("-").map(Number);
          const opt = monthOptions.find((o) => o.year === y && o.month === m);
          if (opt) setSelectedMonth(opt);
        }}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
      >
        {monthOptions.map((o) => (
          <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
            {o.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending ? "生成中..." : `${selectedMonth.label}のサマリーを生成`}
      </button>

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 p-4 text-sm text-accent-red">
          {error}
        </div>
      )}

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
