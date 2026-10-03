import Link from "next/link";
import {
  getEffectiveToday,
  formatDateJP,
  monthStart,
  nextMonthStart,
} from "@/lib/date-utils";
import {
  getSleepRecordByDate,
  getDailyLogByDate,
  getCalendarMonth,
  getMonthlyGoals,
} from "@/lib/db/queries";
import { timestampToTime } from "@/lib/sleep-utils";
import { clearEveningLog, clearMoodLog } from "@/actions/log-actions";
import { ReviewTabs } from "@/components/layout/review-tabs";
import { GoalsCard } from "@/components/log/monthly-goals";
import { DiarySearch } from "@/components/log/diary-search";
import { SleepStageBar } from "@/components/wizard/sleep-stage-bar";
import { MoodGrid } from "@/components/log/mood-grid";
import { ConfirmButton } from "@/components/log/confirm-button";
import { HABITS, HabitIcon, STRESS_CATEGORIES, STRESS_LEVELS } from "@/components/log/habits";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const FRESHNESS_LABEL = ["", "最悪", "悪い", "普通", "良い", "最高"];

function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

function monthsAgo(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(y, m - 1 - months, d);
  if (t.getDate() !== d) t.setDate(0);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const { date, month } = await searchParams;
  const today = getEffectiveToday();

  if (date && DATE.test(date)) return <DayView date={date} today={today} />;
  return <CalendarView month={month && MONTH.test(month) ? `${month}-01` : monthStart(today)} today={today} />;
}

/* ---------- Calendar ---------- */

async function CalendarView({ month, today }: { month: string; today: string }) {
  const next = nextMonthStart(month);
  const prev = monthStart(addDays(month, -1));
  const [{ morning, night }, goals] = await Promise.all([
    getCalendarMonth(month, next),
    getMonthlyGoals(month),
  ]);

  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const isCurrent = month === monthStart(today);

  return (
    <div className="space-y-4">
      <ReviewTabs />

      <div className="flex items-center justify-between">
        <Link
          href={`/log?month=${prev.slice(0, 7)}`}
          aria-label="前の月"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-surface"
        >
          <Chevron dir="left" />
        </Link>
        <h1 className="text-xl font-bold">
          {y}年 {m}月
        </h1>
        {isCurrent ? (
          <span className="h-11 w-11" />
        ) : (
          <Link
            href={`/log?month=${next.slice(0, 7)}`}
            aria-label="次の月"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-surface"
          >
            <Chevron dir="right" />
          </Link>
        )}
      </div>

      <GoalsCard key={month} month={month} label={`${m}月の目標`} initialGoals={goals} />

      <div>
        <div className="grid grid-cols-7 gap-1.5 pb-1.5 text-center text-[11px] text-text-muted">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const d = `${month.slice(0, 8)}${String(i + 1).padStart(2, "0")}`;
            const future = d > today;
            const content = (
              <>
                <span>{i + 1}</span>
                <span className="flex h-1.5 gap-[3px]">
                  <span className={`h-1.5 w-1.5 rounded-full ${morning.has(d) ? "bg-sky" : ""}`} />
                  <span className={`h-1.5 w-1.5 rounded-full ${night.has(d) ? "bg-primary" : ""}`} />
                </span>
              </>
            );
            const base =
              "flex h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-sm tabular-nums";
            return future ? (
              <span key={d} className={`${base} text-text-muted/40`}>
                {content}
              </span>
            ) : (
              <Link
                key={d}
                href={`/log?date=${d}`}
                aria-label={formatDateJP(d)}
                className={`${base} bg-surface hover:bg-surface-hover ${
                  d === today ? "ring-2 ring-primary ring-inset" : ""
                }`}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-4 text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky" />
          朝の記録
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          夜の記録
        </span>
      </div>

      <DiarySearch />
    </div>
  );
}

/* ---------- One day ---------- */

async function DayView({ date, today }: { date: string; today: string }) {
  const past1 = monthsAgo(date, 1);
  const past3 = monthsAgo(date, 3);
  const past6 = monthsAgo(date, 6);
  const [sleep, log, log1, log3, log6] = await Promise.all([
    getSleepRecordByDate(date),
    getDailyLogByDate(date),
    getDailyLogByDate(past1),
    getDailyLogByDate(past3),
    getDailyLogByDate(past6),
  ]);

  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const nextDay = addDays(date, 1);

  const vitality = log?.tdmsVitality;
  const stability = log?.tdmsStability;
  const hasMood = vitality != null && stability != null;
  const stress = (log?.stressSources as Record<string, number> | null) ?? null;
  const stressEntries = stress ? Object.entries(stress).filter(([, v]) => v > 0) : [];
  const habits = HABITS.filter((h) => log?.[h.key]);
  const note = log?.note?.trim();
  const hasNight = hasMood || log?.panasPositive != null || stress != null || !!note;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href={`/log?month=${date.slice(0, 7)}`}
          aria-label="カレンダーに戻る"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-surface"
        >
          <Chevron dir="left" />
        </Link>
        <div className="text-center">
          <p className="text-xs text-text-muted">
            {y}年{m}月
          </p>
          <h1 className="text-2xl font-bold">
            {d}日 <span className="text-lg">{weekday}曜日</span>
          </h1>
        </div>
        <span className="flex">
          <Link
            href={`/log?date=${addDays(date, -1)}`}
            aria-label="前の日"
            className="flex h-11 w-9 items-center justify-center text-text-muted"
          >
            <Chevron dir="left" small />
          </Link>
          {nextDay <= today ? (
            <Link
              href={`/log?date=${nextDay}`}
              aria-label="次の日"
              className="flex h-11 w-9 items-center justify-center text-text-muted"
            >
              <Chevron dir="right" small />
            </Link>
          ) : (
            <span className="w-9" />
          )}
        </span>
      </div>

      {/* Morning */}
      <section className="space-y-3 rounded-2xl bg-surface p-4">
        <SectionHead
          icon={<SunIcon className="h-[18px] w-[18px] text-sky" />}
          title="朝・睡眠"
          href={`/log/morning?date=${date}`}
          linkLabel={sleep ? "直す" : "記録する"}
        />
        {sleep ? (
          <>
            <div className="grid grid-cols-4 gap-1 text-center">
              <Stat
                value={
                  sleep.totalSleepMinutes != null
                    ? `${Math.floor(sleep.totalSleepMinutes / 60)}:${String(sleep.totalSleepMinutes % 60).padStart(2, "0")}`
                    : "—"
                }
                label="睡眠"
              />
              <Stat value={timestampToTime(sleep.bedtime) ?? "—"} label="就寝" />
              <Stat value={timestampToTime(sleep.wakeTime) ?? "—"} label="起床" />
              <Stat value={sleep.avgHeartRate != null ? `${sleep.avgHeartRate}` : "—"} label="心拍" />
            </div>
            {(sleep.deepMinutes || sleep.lightMinutes || sleep.remMinutes) && (
              <SleepStageBar
                deep={sleep.deepMinutes ?? 0}
                light={sleep.lightMinutes ?? 0}
                rem={sleep.remMinutes ?? 0}
              />
            )}
            <p className="text-xs text-text-muted">
              すっきり度{" "}
              {log?.freshnessScore != null
                ? `${log.freshnessScore}（${FRESHNESS_LABEL[log.freshnessScore]}）`
                : "未記入"}
            </p>
          </>
        ) : (
          <p className="text-sm text-text-muted">記録がありません</p>
        )}
      </section>

      {/* Night */}
      <section className="space-y-3 rounded-2xl bg-surface p-4">
        <SectionHead
          icon={<MoonIcon className="h-[18px] w-[18px] text-primary" />}
          title="夜・気分とストレス"
        />
        {hasMood ? (
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Tile label="快適度" value={signed(vitality + stability)} />
              <Tile label="覚醒度" value={signed(vitality - stability)} />
            </div>
            <MoodGrid pleasure={vitality + stability} arousal={vitality - stability} size={120} />
          </div>
        ) : log?.panasPositive != null ? (
          <p className="text-xs text-text-muted">
            旧尺度（PANAS）：ポジ {log.panasPositive}/25・ネガ {log.panasNegative}/25
          </p>
        ) : null}

        {(stressEntries.length > 0 || habits.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {stressEntries.map(([id, v]) => (
              <span
                key={id}
                className="rounded-full border border-coral/50 bg-coral-soft px-2.5 py-1 text-xs text-coral-text"
              >
                {STRESS_CATEGORIES.find((c) => c.id === id)?.label ?? id}{" "}
                {STRESS_LEVELS.find((l) => l.value === v)?.label ?? v}
              </span>
            ))}
            {habits.map((h) => (
              <span
                key={h.key}
                className="flex items-center gap-1 rounded-full border border-accent-green/40 bg-accent-green-soft px-2.5 py-1 text-xs text-[#1e5e3e]"
              >
                <HabitIcon path={h.icon} className="h-3.5 w-3.5" />
                {h.label}
              </span>
            ))}
          </div>
        )}
        {stress != null && stressEntries.length === 0 && (
          <p className="text-xs text-text-muted">ストレスなし</p>
        )}
        {!hasMood && log?.panasPositive == null && stress == null && (
          <p className="text-sm text-text-muted">記録がありません</p>
        )}

        <div className="flex gap-2 pt-1">
          <Link
            href={`/log/mood?date=${date}`}
            className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-border text-xs text-primary"
          >
            {hasMood ? "気分を直す" : "気分を記録"}
          </Link>
          <Link
            href={`/log/stress?date=${date}`}
            className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-border text-xs text-primary"
          >
            {stress != null ? "ストレス・習慣を直す" : "ストレス・習慣を記録"}
          </Link>
        </div>
      </section>

      {/* Diary */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">日記</h2>
          <Link href={`/log/evening?date=${date}`} className="text-xs text-primary">
            {note ? "書き足す" : "書く"}
          </Link>
        </div>
        {note ? (
          <p className="whitespace-pre-wrap text-base leading-[2]">{note}</p>
        ) : (
          <p className="text-sm text-text-muted">まだ書かれていません</p>
        )}
      </section>

      <PastSelves
        entries={[
          { label: "1ヶ月前", date: past1, note: log1?.note },
          { label: "3ヶ月前", date: past3, note: log3?.note },
          { label: "半年前", date: past6, note: log6?.note },
        ]}
      />

      {hasNight && (
        <div className="flex justify-center gap-2 border-t border-border pt-3">
          {hasMood && (
            <ConfirmButton
              label="気分の記録を消す"
              confirmLabel="もう一度押すと消します"
              action={clearMoodLog.bind(null, date)}
            />
          )}
          {(stress != null || note) && (
            <ConfirmButton
              label="ストレス・習慣・日記を消す"
              confirmLabel="もう一度押すと消します"
              action={clearEveningLog.bind(null, date)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function PastSelves({
  entries,
}: {
  entries: { label: string; date: string; note: string | null | undefined }[];
}) {
  const shown = entries.filter((e) => e.note?.trim());
  if (shown.length === 0) return null;
  return (
    <section className="space-y-2 border-t border-border pt-4">
      <h2 className="text-xs text-text-muted">同じ日付の、むかしの自分</h2>
      {shown.map((e) => (
        <Link
          key={e.date}
          href={`/log?date=${e.date}`}
          className="flex flex-col gap-1.5 rounded-2xl bg-surface p-3"
        >
          <span className="text-[11px] text-text-muted">
            {e.label}・{formatDateJP(e.date)}
          </span>
          <span className="line-clamp-3 text-[13px] leading-relaxed">{e.note}</span>
        </Link>
      ))}
    </section>
  );
}

function SectionHead({
  icon,
  title,
  href,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="flex-1 text-sm font-bold">{title}</h2>
      {href && (
        <Link href={href} className="text-xs text-primary">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-text-muted">{label}</p>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background p-2.5 text-center">
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Chevron({ dir, small }: { dir: "left" | "right"; small?: boolean }) {
  return (
    <svg className={small ? "h-[18px] w-[18px]" : "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d={dir === "left" ? "M15 19 8 12l7-7" : "m9 5 7 7-7 7"} />
    </svg>
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
