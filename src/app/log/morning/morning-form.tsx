"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmojiPicker } from "@/components/log/emoji-picker";
import { Spinner } from "@/components/ui/spinner";
import { saveFreshnessScore, clearFreshnessScore } from "@/actions/log-actions";

export function MorningForm({
  date,
  initialScore,
}: {
  date: string;
  initialScore: number | null;
}) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSelect(newScore: number) {
    setScore(newScore);
    setSaved(false);
    startTransition(async () => {
      await saveFreshnessScore(date, newScore);
      setSaved(true);
    });
  }

  function handleClear() {
    startTransition(async () => {
      await clearFreshnessScore(date);
      setScore(null);
      setSaved(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <EmojiPicker value={score} onChange={handleSelect} disabled={isPending} />
      <div className="flex h-6 items-center justify-center gap-3">
        {isPending && <Spinner className="text-primary" />}
        {saved && !isPending && (
          <p className="text-sm text-accent-green">保存しました</p>
        )}
        {score != null && !isPending && (
          <button
            onClick={handleClear}
            className="text-xs text-text-muted underline"
          >
            取り消す
          </button>
        )}
      </div>
    </div>
  );
}
