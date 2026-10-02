import type { DailyLog } from "@/lib/db/schema";

export type CheckinWindow = "morning" | "night" | null;

/** 朝のチェックインは 4〜12時、夜は 20〜翌4時。その間の昼はどちらも出さない。 */
export function checkinWindow(jstHour: number): CheckinWindow {
  if (jstHour >= 4 && jstHour < 12) return "morning";
  if (jstHour >= 20 || jstHour < 4) return "night";
  return null;
}

export type NightStep = "mood" | "stress" | "diary";

export const NIGHT_STEPS: { step: NightStep; label: string; path: string }[] = [
  { step: "mood", label: "気分", path: "/log/mood" },
  { step: "stress", label: "ストレス・習慣", path: "/log/stress" },
  { step: "diary", label: "日記", path: "/log/evening" },
];

/**
 * Which night steps have been done. Stress counts once the step has been
 * saved at all (`{}` included): "no stress today" is a real answer.
 */
export function nightProgress(log: DailyLog | null): Record<NightStep, boolean> {
  return {
    mood: log?.tdmsVitality != null || log?.panasPositive != null,
    stress: log?.stressSources != null,
    diary: !!log?.note?.trim(),
  };
}

export function nightStepHref(step: NightStep, date: string) {
  const s = NIGHT_STEPS.find((n) => n.step === step)!;
  return `${s.path}?date=${date}`;
}

/** The step after `step`, or null at the end of the night check-in. */
export function nextNightStep(step: NightStep): NightStep | null {
  const i = NIGHT_STEPS.findIndex((n) => n.step === step);
  return NIGHT_STEPS[i + 1]?.step ?? null;
}
