"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Check-ins are focused flows with their own back and close buttons. */
const CHECKIN_PATHS = ["/log/morning", "/log/mood", "/log/stress", "/log/evening"];

/** Everything under ふりかえり: the calendar, a day's page, graphs and the monthly summary. */
function isReview(pathname: string) {
  return (
    pathname === "/log" ||
    pathname.startsWith("/trends") ||
    pathname.startsWith("/review") ||
    pathname.startsWith("/history")
  );
}

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;
  if (CHECKIN_PATHS.some((p) => pathname.startsWith(p))) return null;

  const items = [
    { href: "/", label: "ホーム", icon: HomeIcon, active: pathname === "/" },
    { href: "/trends", label: "ふりかえり", icon: CalendarIcon, active: isReview(pathname) },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-lg grid-cols-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors ${
              active ? "text-primary" : "text-text-muted"
            }`}
          >
            <Icon className="h-[22px] w-[22px]" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 12 4l9 7v9H3z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
