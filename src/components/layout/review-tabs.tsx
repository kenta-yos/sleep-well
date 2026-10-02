"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/trends", label: "グラフ" },
  { href: "/log", label: "カレンダー" },
  { href: "/review", label: "月のまとめ" },
];

/** The three views under ふりかえり. */
export function ReviewTabs() {
  const pathname = usePathname();
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface p-1">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[40px] items-center justify-center rounded-[9px] text-[13px] transition-colors ${
              active ? "bg-primary-soft font-bold text-text" : "text-text-muted"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
