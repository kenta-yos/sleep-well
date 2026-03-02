import Link from "next/link";
import { LogoutButton } from "./logout-button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">設定</h1>

      <div className="space-y-3">
        <Link
          href="/import"
          className="flex min-h-[48px] items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-hover"
        >
          <span>CSVインポート</span>
          <ChevronRight />
        </Link>

        <Link
          href="/review"
          className="flex min-h-[48px] items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:bg-surface-hover"
        >
          <span>週次AIレビュー</span>
          <ChevronRight />
        </Link>
      </div>

      <div className="pt-4">
        <LogoutButton />
      </div>

      <p className="text-center text-xs text-text-muted">Sleep Well v0.1.0</p>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      className="h-4 w-4 text-text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
