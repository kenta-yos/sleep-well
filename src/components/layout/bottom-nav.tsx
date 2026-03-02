"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getJSTHour, getYesterdayDateStr } from "@/lib/date-utils";

const navItems = [
  { href: "/", label: "ホーム", icon: HomeIcon },
  { href: "/log", label: "ログ", icon: PenIcon },
  { href: "/trends", label: "トレンド", icon: ChartIcon },
  { href: "/settings", label: "その他", icon: MoreIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  if (pathname === "/login") return null;

  function getHref(href: string) {
    if (href === "/log") {
      const hour = getJSTHour();
      if (dateParam) {
        const base = hour < 12 ? "/log/morning" : "/log/evening";
        return `${base}?date=${dateParam}`;
      }
      // 0-4am JST: probably still up from yesterday → evening log for yesterday
      if (hour < 4) {
        return `/log/evening?date=${getYesterdayDateStr()}`;
      }
      // 4-12 JST: morning log for today
      if (hour < 12) return "/log/morning";
      // 12+ JST: evening log for today
      return "/log/evening";
    }
    if (href === "/" && dateParam) {
      return `/?date=${dateParam}`;
    }
    return href;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={getHref(href)}
              className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs transition-colors ${
                isActive ? "text-primary" : "text-text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
  );
}
