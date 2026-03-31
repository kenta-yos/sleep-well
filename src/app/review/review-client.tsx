"use client";

import { useState, useTransition } from "react";
import {
  generateWeeklyReviewAction,
  generateMonthlyReviewAction,
} from "@/actions/ai-actions";
import { formatDateJP } from "@/lib/date-utils";

type Tab = "weekly" | "monthly";

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
  weeklyContent,
  weeklyDate,
  monthlyContent,
  monthlyDate,
}: {
  weeklyContent: string | null;
  weeklyDate: string | null;
  monthlyContent: string | null;
  monthlyDate: string | null;
}) {
  const [tab, setTab] = useState<Tab>("weekly");
  const [wContent, setWContent] = useState(weeklyContent);
  const [wDate, setWDate] = useState(weeklyDate);
  const [mContent, setMContent] = useState(monthlyContent);
  const [mDate, setMDate] = useState(monthlyDate);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(
    () => monthOptions[1] ?? monthOptions[0] // default to previous month
  );

  function handleGenerateWeekly() {
    setError(null);
    startTransition(async () => {
      const result = await generateWeeklyReviewAction();
      if (result.error) {
        setError(result.error);
      } else {
        setWContent(result.content);
        setWDate(new Date().toISOString().split("T")[0]);
      }
    });
  }

  function handleGenerateMonthly() {
    setError(null);
    startTransition(async () => {
      const result = await generateMonthlyReviewAction(
        selectedMonth.year,
        selectedMonth.month
      );
      if (result.error) {
        setError(result.error);
      } else {
        setMContent(result.content);
        setMDate(
          `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-01`
        );
      }
    });
  }

  const content = tab === "weekly" ? wContent : mContent;
  const date = tab === "weekly" ? wDate : mDate;

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border bg-surface p-1">
        <button
          onClick={() => setTab("weekly")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "weekly"
              ? "bg-primary text-white"
              : "text-text-muted hover:text-text"
          }`}
        >
          週次レビュー
        </button>
        <button
          onClick={() => setTab("monthly")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "monthly"
              ? "bg-primary text-white"
              : "text-text-muted hover:text-text"
          }`}
        >
          月次サマリー
        </button>
      </div>

      {/* Monthly: month selector */}
      {tab === "monthly" && (
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
      )}

      {/* Generate button */}
      <button
        onClick={tab === "weekly" ? handleGenerateWeekly : handleGenerateMonthly}
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending
          ? "生成中..."
          : tab === "weekly"
            ? "週次レビューを生成"
            : `${selectedMonth.label}のサマリーを生成`}
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
              {tab === "monthly"
                ? `${date.split("-")[0]}年${parseInt(date.split("-")[1])}月分`
                : formatDateJP(date)}{" "}
              生成
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
