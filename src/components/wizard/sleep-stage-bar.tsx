"use client";

export function SleepStageBar({
  deep,
  light,
  rem,
}: {
  deep: number;
  light: number;
  rem: number;
}) {
  const total = deep + light + rem;
  if (total === 0) return null;

  const deepPct = (deep / total) * 100;
  const lightPct = (light / total) * 100;
  const remPct = (rem / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full">
        <div
          className="bg-deep transition-all duration-300"
          style={{ width: `${deepPct}%` }}
        />
        <div
          className="bg-light transition-all duration-300"
          style={{ width: `${lightPct}%` }}
        />
        <div
          className="bg-rem transition-all duration-300"
          style={{ width: `${remPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-deep" />
          深い {Math.round(deepPct)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-light" />
          浅い {Math.round(lightPct)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-rem" />
          REM {Math.round(remPct)}%
        </span>
      </div>
    </div>
  );
}
