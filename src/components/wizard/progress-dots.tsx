"use client";

export function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              isCurrent
                ? "h-2 w-6 bg-primary"
                : isDone
                  ? "h-2 w-2 bg-accent-green"
                  : "h-2 w-2 bg-border"
            }`}
          />
        );
      })}
    </div>
  );
}
