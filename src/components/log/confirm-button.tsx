"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * A destructive action that asks twice in place instead of opening a
 * browser dialog: the first tap arms it, the second runs it.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  action,
}: {
  label: string;
  confirmLabel: string;
  action: () => Promise<unknown>;
}) {
  const [armed, setArmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        startTransition(async () => {
          await action();
          setArmed(false);
          router.refresh();
        });
      }}
      onBlur={() => setArmed(false)}
      className={`min-h-[36px] px-2 text-xs underline ${armed ? "font-bold text-accent-red" : "text-text-muted"}`}
    >
      {isPending ? "消しています..." : armed ? confirmLabel : label}
    </button>
  );
}
