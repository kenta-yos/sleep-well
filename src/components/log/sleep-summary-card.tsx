import type { SleepRecord } from "@/lib/db/schema";

function formatTime(date: Date | string | null): string {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function SleepSummaryCard({ record }: { record: SleepRecord | null }) {
  if (!record) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-text-muted">昨夜の睡眠データがありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-text-muted">昨夜の睡眠</h3>
      </div>

      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          {formatDuration(record.totalSleepMinutes)}
        </span>
      </div>

      <div className="flex gap-4 text-xs text-text-muted">
        <span>就寝 {formatTime(record.bedtime)}</span>
        <span>起床 {formatTime(record.wakeTime)}</span>
      </div>

      <div className="mt-3 flex gap-2">
        {record.deepMinutes != null && record.deepMinutes > 0 && (
          <StageBadge label="深い" minutes={record.deepMinutes} color="bg-deep" />
        )}
        {record.lightMinutes != null && record.lightMinutes > 0 && (
          <StageBadge label="浅い" minutes={record.lightMinutes} color="bg-light" />
        )}
        {record.remMinutes != null && record.remMinutes > 0 && (
          <StageBadge label="REM" minutes={record.remMinutes} color="bg-rem" />
        )}
      </div>
    </div>
  );
}

function StageBadge({
  label,
  minutes,
  color,
}: {
  label: string;
  minutes: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-text-muted">
        {label} {Math.floor(minutes / 60)}h{minutes % 60}m
      </span>
    </div>
  );
}
