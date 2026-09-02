"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VISIBLE_MS = 2200;

export interface ToastState {
  /** Bumped on every call so repeated saves restart the timer and the animation. */
  id: number;
  message: string;
  tone: "success" | "error";
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback(
    (message: string, tone: ToastState["tone"] = "success") => {
      idRef.current += 1;
      setToast({ id: idRef.current, message, tone });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setToast(null), VISIBLE_MS);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast };
}

/**
 * Sits above the fixed bottom nav so it stays clear of it and of the home
 * indicator. Keyed on toast.id so a second save replays the animation instead
 * of leaving a static pill on screen.
 */
export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="toast-pop pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
    >
      <div
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-lg ${
          toast.tone === "success"
            ? "border-accent-green/40 bg-surface text-accent-green"
            : "border-accent-red/40 bg-surface text-accent-red"
        }`}
      >
        {toast.tone === "success" ? <CheckIcon /> : <AlertIcon />}
        {toast.message}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    </svg>
  );
}
