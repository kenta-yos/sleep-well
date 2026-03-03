"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

function formatDisplayDate(dateStr: string, today: string): string {
  if (dateStr === today) return "今日";

  const d = new Date(dateStr + "T00:00:00+09:00");
  const t = new Date(today + "T00:00:00+09:00");
  const diff = Math.round(
    (t.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 1) return "昨日";

  return d.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateNav({
  date,
  today,
}: {
  date: string;
  today: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isToday = date === today;
  const [isPending, startTransition] = useTransition();

  function navigate(newDate: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newDate === today) {
        params.delete("date");
      } else {
        params.set("date", newDate);
      }
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => navigate(shiftDate(date, -1))}
        disabled={isPending}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface disabled:opacity-50"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="text-center">
        {isPending ? (
          <Spinner className="text-primary" />
        ) : (
          <>
            <p className="text-lg font-bold">{formatDisplayDate(date, today)}</p>
            <p className="text-xs text-text-muted">{date}</p>
          </>
        )}
      </div>

      <button
        onClick={() => navigate(shiftDate(date, 1))}
        disabled={isToday || isPending}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface disabled:opacity-30"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
