"use client";

import { useState, useTransition } from "react";
import { generateWeeklyReviewAction } from "@/actions/ai-actions";
import { formatDateJP } from "@/lib/date-utils";

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

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateWeeklyReviewAction();
      if (result.error) {
        setError(result.error);
      } else {
        setContent(result.content);
        setDate(new Date().toISOString().split("T")[0]);
      }
    });
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending ? "生成中..." : "レビューを生成"}
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
              {formatDateJP(date)} 生成
            </p>
          )}
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
