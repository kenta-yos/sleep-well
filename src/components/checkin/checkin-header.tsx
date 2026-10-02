import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Top bar shared by the check-in screens: a back or close button, a segmented
 * progress bar, and a short label on the right.
 */
export function CheckinHeader({
  backHref,
  closeHref,
  total,
  current,
  right,
}: {
  /** Shows a back arrow. Without it, the button closes to `closeHref`. */
  backHref?: string;
  closeHref?: string;
  total: number;
  /** 1-based index of the current step. */
  current: number;
  right?: ReactNode;
}) {
  const href = backHref ?? closeHref ?? "/";
  return (
    <div className="flex items-center gap-3">
      <Link
        href={href}
        aria-label={backHref ? "戻る" : "閉じる"}
        className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-muted hover:bg-surface"
      >
        {backHref ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M15 19 8 12l7-7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        )}
      </Link>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < current ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs text-text-muted">{right}</span>
    </div>
  );
}
