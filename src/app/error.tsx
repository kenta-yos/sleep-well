"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <p className="text-sm text-accent-red">エラーが発生しました</p>
      <p className="text-xs text-text-muted">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        再試行
      </button>
    </div>
  );
}
