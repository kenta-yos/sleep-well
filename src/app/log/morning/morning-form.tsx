"use client";

import { useState, useTransition } from "react";
import { EmojiPicker } from "@/components/log/emoji-picker";
import { saveFreshnessScore } from "@/actions/log-actions";

export function MorningForm({
  date,
  initialScore,
}: {
  date: string;
  initialScore: number | null;
}) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [saved, setSaved] = useState(!!initialScore);
  const [isPending, startTransition] = useTransition();

  function handleSelect(newScore: number) {
    setScore(newScore);
    setSaved(false);
    startTransition(async () => {
      await saveFreshnessScore(date, newScore);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      <EmojiPicker value={score} onChange={handleSelect} disabled={isPending} />
      {saved && score && (
        <p className="text-center text-sm text-accent-green">
          保存しました
        </p>
      )}
    </div>
  );
}
