import Link from "next/link";
import {
  getEffectiveToday,
  getJSTHour,
  formatDateJP,
  monthStart,
  nextMonthStart,
  daysLeftInMonth,
} from "@/lib/date-utils";
import {
  getSleepRecordByDate,
  getDailyLogByDate,
  getSleepRecordCount,
  getMonthlyGoals,
} from "@/lib/db/queries";
import { timestampToTime } from "@/lib/sleep-utils";
import {
  checkinWindow,
  nightProgress,
  nightStepHref,
  NIGHT_STEPS,
} from "@/lib/checkin";
import { SleepStageBar } from "@/components/wizard/sleep-stage-bar";
import { GoalsCard, GoalsEditor } from "@/components/log/monthly-goals";
import type { DailyLog, SleepRecord } from "@/lib/db/schema";

function monthsAgo(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(y, m - 1 - months, d);
  // 3/31 minus one month lands on 2/31 → 3/3; pull back to the month's end.
  if (t.getDate() !== d) t.setDate(0);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function hm(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

const monthLabel = (m: string) => `${Number(m.slice(5, 7))}月`;

// Greeting and check-in cards depend on the current hour, so never prerender.
export const dynamic = "force-dynamic";

function jstClock() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default async function HomePage() {
  const today = getEffectiveToday();
  const hour = getJSTHour();
  const window = checkinWindow(hour);
  const oneMonthAgo = monthsAgo(today, 1);
  const threeMonthsAgo = monthsAgo(today, 3);
  const sixMonthsAgo = monthsAgo(today, 6);
  const thisMonth = monthStart(today);
  const nextMonth = daysLeftInMonth(today) < 3 ? nextMonthStart(today) : null;

  const [sleep, log, totalCount, goals, nextGoals, past1, past3, past6] = await Promise.all([
    getSleepRecordByDate(today),
    getDailyLogByDate(today),
    getSleepRecordCount(),
    getMonthlyGoals(thisMonth),
    nextMonth ? getMonthlyGoals(nextMonth) : null,
    getDailyLogByDate(oneMonthAgo),
    getDailyLogByDate(threeMonthsAgo),
    getDailyLogByDate(sixMonthsAgo),
  ]);

  if (totalCount === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sleep Well</h1>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">まずは睡眠データをインポートしましょう</p>
          <Link
            href="/import"
            className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            CSVインポート
          </Link>
        </div>
      </div>
    );
  }

  const morningDone = sleep != null;
  const night = nightProgress(log);
  const nightDone = night.mood && night.stress && night.diary;

  const showMorning = window === "morning" && !morningDone;
  const showNight = window === "night" && !nightDone;

  const greeting =
    window === "morning"
      ? "おはよう"
      : window === "night"
        ? nightDone
          ? "おやすみなさい"
          : "おつかれさま"
        : "こんにちは";
  const clock = jstClock();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-text-muted">
            {formatDateJP(today)}
            {window === "night" && hour < 4 ? "の夜" : ""}　{clock}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{greeting}</h1>
        </div>
        <Link
          href="/settings"
          aria-label="設定"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-surface"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </div>

      {showMorning && <MorningCard date={today} />}
      {showNight && <NightCard date={today} progress={night} />}

      <GoalsCard
        key={thisMonth}
        month={thisMonth}
        label={`${monthLabel(thisMonth)}の目標`}
        initialGoals={goals}
      />

      {nextMonth && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <GoalsEditor
            month={nextMonth}
            title={`来月（${monthLabel(nextMonth)}）の目標`}
            initialGoals={nextGoals ?? []}
          />
        </div>
      )}

      <TodayCard date={today} sleep={sleep} log={log} />

      {!morningDone && window !== "morning" && (
        <Link
          href={`/log/morning?date=${today}`}
          className="flex min-h-[48px] items-center justify-between rounded-xl border border-dashed border-border px-4 text-sm text-text-muted hover:bg-surface"
        >
          <span>今朝の睡眠がまだ記録されていません</span>
          <span className="text-primary">記録する</span>
        </Link>
      )}

      {window === null && !nightDone && (
        <p className="text-center text-xs text-text-muted">夜のチェックインは 20:00 から</p>
      )}

      <PastDiaries
        entries={[
          { label: "1ヶ月前", date: oneMonthAgo, log: past1 },
          { label: "3ヶ月前", date: threeMonthsAgo, log: past3 },
          { label: "半年前", date: sixMonthsAgo, log: past6 },
        ]}
      />
    </div>
  );
}

function MorningCard({ date }: { date: string }) {
  return (
    <Link
      href={`/log/morning?date=${date}`}
      className="flex flex-col gap-3 rounded-2xl border border-sky-border bg-sky-soft p-4"
    >
      <span className="flex items-center gap-2.5">
        <SunIcon className="h-[22px] w-[22px] text-sky" />
        <span className="flex-1 text-base font-bold">朝のチェックイン</span>
        <span className="text-xs text-text-muted">12時まで</span>
      </span>
      <span className="text-[13px] leading-relaxed text-text-muted">
        すっきり度と、睡眠アプリの数字を入れる（約30秒）
      </span>
      <span className="flex min-h-[48px] items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-white">
        はじめる
      </span>
    </Link>
  );
}

function NightCard({
  date,
  progress,
}: {
  date: string;
  progress: Record<"mood" | "stress" | "diary", boolean>;
}) {
  const next = NIGHT_STEPS.find((s) => !progress[s.step])!;
  const started = NIGHT_STEPS.some((s) => progress[s.step]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-night-soft p-4">
      <div className="flex items-center gap-2.5">
        <MoonIcon className="h-[22px] w-[22px] text-primary" />
        <span className="flex-1 text-base font-bold">夜のチェックイン</span>
        <span className="text-xs text-text-muted">4時まで</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {NIGHT_STEPS.map((s) => (
          <Link
            key={s.step}
            href={nightStepHref(s.step, date)}
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl bg-surface text-xs"
          >
            {progress[s.step] ? (
              <svg className="h-[18px] w-[18px] text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg className="h-[18px] w-[18px] text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="7" />
              </svg>
            )}
            {s.label}
          </Link>
        ))}
      </div>
      <Link
        href={nightStepHref(next.step, date)}
        className="flex min-h-[48px] items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-white hover:bg-primary-hover"
      >
        {started ? "つづきから" : "はじめる"}
      </Link>
    </div>
  );
}

/** What has been logged today, morning and night together. */
function TodayCard({
  date,
  sleep,
  log,
}: {
  date: string;
  sleep: SleepRecord | null;
  log: DailyLog | null;
}) {
  const stress = log?.stressSources
    ? Object.values(log.stressSources as Record<string, number>).reduce((a, b) => a + b, 0)
    : null;
  const pleasure =
    log?.tdmsVitality != null && log.tdmsStability != null
      ? log.tdmsVitality + log.tdmsStability
      : null;
  const note = log?.note?.trim();

  if (!sleep && pleasure == null && stress == null && !note) return null;

  const bed = timestampToTime(sleep?.bedtime ?? null);
  const wake = timestampToTime(sleep?.wakeTime ?? null);

  return (
    <Link
      href={`/log?date=${date}`}
      className="flex flex-col gap-3 rounded-2xl bg-surface p-4"
    >
      <span className="flex items-center justify-between">
        <span className="text-sm font-bold">今日の記録</span>
        <span className="text-xs text-primary">くわしく見る・直す</span>
      </span>

      {sleep?.totalSleepMinutes != null && (
        <span className="grid grid-cols-4 gap-1 text-center">
          <Stat value={hm(sleep.totalSleepMinutes)} label="睡眠" />
          <Stat value={bed ?? "--:--"} label="就寝" />
          <Stat value={wake ?? "--:--"} label="起床" />
          <Stat value={log?.freshnessScore != null ? `${log.freshnessScore}` : "—"} label="すっきり" />
        </span>
      )}
      {sleep && (sleep.deepMinutes || sleep.lightMinutes || sleep.remMinutes) ? (
        <SleepStageBar
          deep={sleep.deepMinutes ?? 0}
          light={sleep.lightMinutes ?? 0}
          rem={sleep.remMinutes ?? 0}
        />
      ) : null}

      {(pleasure != null || stress != null) && (
        <span className="flex flex-wrap gap-1.5">
          {pleasure != null && <Chip>快適度 {signed(pleasure)}</Chip>}
          {stress != null && <Chip>ストレス {stress}</Chip>}
        </span>
      )}

      {note && (
        <span className="line-clamp-3 text-[13px] leading-relaxed text-text-muted">{note}</span>
      )}
    </Link>
  );
}

function PastDiaries({
  entries,
}: {
  entries: { label: string; date: string; log: DailyLog | null }[];
}) {
  const shown = entries.filter((e) => e.log?.note?.trim());
  if (shown.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">あの日の日記</p>
      <div className="space-y-2">
        {shown.map((e) => (
          <Link
            key={e.date}
            href={`/log?date=${e.date}`}
            className="flex flex-col gap-1.5 rounded-2xl bg-surface p-3"
          >
            <span className="text-[11px] text-text-muted">
              {e.label}・{formatDateJP(e.date)}
            </span>
            <span className="line-clamp-3 text-[13px] leading-relaxed">{e.log!.note}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span>
      <span className="block text-lg font-bold tabular-nums">{value}</span>
      <span className="block text-[11px] text-text-muted">{label}</span>
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-background px-2 py-1 text-xs tabular-nums">{children}</span>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
