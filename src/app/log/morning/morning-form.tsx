"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SleepStageBar } from "@/components/wizard/sleep-stage-bar";
import { Spinner } from "@/components/ui/spinner";
import { Toast, useToast } from "@/components/ui/toast";
import { getDefaultTimes } from "@/lib/sleep-utils";
import {
  type DigitKind,
  formatDigitValue,
  maxDigitsFor,
  parseDigits,
  toDigits,
} from "@/lib/digit-entry";

interface InitialData {
  freshnessScore: number | null;
  bedtime: string | null;
  wakeTime: string | null;
  totalSleepMinutes: number | null;
  deepMinutes: number | null;
  lightMinutes: number | null;
  remMinutes: number | null;
  avgHeartRate: number | null;
}

interface Values {
  freshnessScore: number | null;
  totalSleepMinutes: number;
  remMinutes: number;
  lightMinutes: number;
  deepMinutes: number;
  bedtime: number;
  wakeTime: number;
  avgHeartRate: number;
}

type NumericKey = Exclude<keyof Values, "freshnessScore">;

interface NumericStep {
  key: NumericKey;
  kind: DigitKind;
  title: string;
  example: string;
  min: number;
  max: number;
}

const NUMERIC_STEPS: NumericStep[] = [
  { key: "totalSleepMinutes", kind: "duration", title: "総睡眠時間", example: "7時間50分 → 0750", min: 60, max: 720 },
  { key: "remMinutes", kind: "duration", title: "REM睡眠", example: "1時間30分 → 0130", min: 0, max: 240 },
  { key: "lightMinutes", kind: "duration", title: "浅い睡眠", example: "3時間30分 → 0330", min: 0, max: 480 },
  { key: "deepMinutes", kind: "duration", title: "深い睡眠", example: "1時間05分 → 0105", min: 0, max: 300 },
  { key: "bedtime", kind: "clock", title: "就寝時刻", example: "23時30分 → 2330", min: 0, max: 1439 },
  { key: "wakeTime", kind: "clock", title: "起床時刻", example: "7時05分 → 0705", min: 0, max: 1439 },
  { key: "avgHeartRate", kind: "count", title: "平均心拍数", example: "58 bpm → 58", min: 30, max: 120 },
];

const FRESHNESS = [
  { score: 1, label: "最悪" },
  { score: 2, label: "悪い" },
  { score: 3, label: "普通" },
  { score: 4, label: "良い" },
  { score: 5, label: "最高" },
];

// Step 0 is すっきり度, then one step per numeric field, then the summary.
const CONFIRM_STEP = NUMERIC_STEPS.length + 1;

/** "HH:MM" → minutes since midnight */
function parseTime(t: string | null, fallback: string) {
  const [h, m] = (t ?? fallback).split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function initialValues(initialData: InitialData | null): Values {
  const defaults = getDefaultTimes();
  return {
    freshnessScore: initialData?.freshnessScore ?? null,
    totalSleepMinutes: initialData?.totalSleepMinutes ?? defaults.totalSleepMinutes,
    remMinutes: initialData?.remMinutes ?? defaults.remMinutes,
    lightMinutes: initialData?.lightMinutes ?? defaults.lightMinutes,
    deepMinutes: initialData?.deepMinutes ?? defaults.deepMinutes,
    bedtime: parseTime(initialData?.bedtime ?? null, defaults.bedtime),
    wakeTime: parseTime(initialData?.wakeTime ?? null, defaults.wakeTime),
    avgHeartRate: initialData?.avgHeartRate ?? defaults.avgHeartRate,
  };
}

export function MorningForm({
  date,
  initialData,
}: {
  date: string;
  initialData: InitialData | null;
}) {
  const router = useRouter();
  const hasRecord = initialData?.totalSleepMinutes != null;

  const [values, setValues] = useState(() => initialValues(initialData));
  // An existing record opens on the summary, since it is usually a fix-up.
  const [step, setStep] = useState(hasRecord ? CONFIRM_STEP : 0);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();
  // One input stays mounted through every step: iOS only keeps the keyboard
  // up when focus moves synchronously within a tap, and a freshly mounted
  // input cannot be focused that way.
  const inputRef = useRef<HTMLInputElement>(null);

  const numeric = step >= 1 && step < CONFIRM_STEP ? NUMERIC_STEPS[step - 1] : null;
  const draftValue = numeric
    ? parseDigits(numeric.kind, draft, numeric.min, numeric.max)
    : null;
  const invalid = draft !== "" && draftValue === null;

  function goTo(next: number) {
    setDraft("");
    setStep(next);
    if (next >= 1 && next < CONFIRM_STEP) inputRef.current?.focus();
    else inputRef.current?.blur();
  }

  function commitAndNext(digits: string) {
    if (numeric && digits !== "") {
      const parsed = parseDigits(numeric.kind, digits, numeric.min, numeric.max);
      if (parsed === null) return;
      setValues((v) => ({ ...v, [numeric.key]: parsed }));
    }
    goTo(step + 1);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          ...values,
          bedtime: formatTime(values.bedtime),
          wakeTime: formatTime(values.wakeTime),
        }),
      });

      if (res.ok) {
        // A fix-up came from that day's page, so return there; a fresh log
        // goes back home, where the morning card has now cleared.
        router.push(hasRecord ? `/log?date=${date}` : "/");
        router.refresh();
      } else {
        showToast("保存に失敗しました", "error");
      }
    } catch {
      showToast("保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setValues(initialValues(initialData));
    goTo(hasRecord ? CONFIRM_STEP : 0);
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Progress */}
      <div className="flex gap-1">
        {Array.from({ length: CONFIRM_STEP + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`ステップ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="wizard-slide space-y-4" key={step}>
        {step === 0 && (
          <>
            <h2 className="text-center text-lg font-bold">起きたときのすっきり度</h2>
            <div className="grid grid-cols-5 gap-1.5">
              {FRESHNESS.map((f) => {
                const selected = values.freshnessScore === f.score;
                return (
                  <button
                    key={f.score}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setValues((v) => ({ ...v, freshnessScore: f.score }));
                      goTo(1);
                    }}
                    className={`flex min-h-[56px] flex-col items-center justify-center rounded-xl text-[13px] transition-colors ${
                      selected
                        ? "border-2 border-primary bg-primary-soft font-bold text-text"
                        : "border border-border bg-surface text-text-muted"
                    }`}
                  >
                    <span className="text-[10px] tabular-nums opacity-70">{f.score}</span>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {numeric && (
          <div className="text-center">
            <h2 className="text-lg font-bold">{numeric.title}</h2>
            <p className="text-sm text-text-muted">{numeric.example}</p>
          </div>
        )}

        {step === CONFIRM_STEP && (
          <>
            <h2 className="text-center text-lg font-bold">確認</h2>
            <SleepStageBar
              deep={values.deepMinutes}
              light={values.lightMinutes}
              rem={values.remMinutes}
            />
            <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
              <SummaryRow
                label="すっきり度"
                value={values.freshnessScore != null ? `${values.freshnessScore} / 5` : "未入力"}
                onClick={() => goTo(0)}
              />
              {NUMERIC_STEPS.map((s, i) => (
                <SummaryRow
                  key={s.key}
                  label={s.title}
                  value={formatDigitValue(s.kind, values[s.key])}
                  onClick={() => goTo(i + 1)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Kept mounted on every step so the keyboard survives step changes;
          visually hidden outside the numeric steps. */}
      <div className={numeric ? "space-y-2" : "sr-only"}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="next"
          autoComplete="off"
          aria-label={numeric?.title}
          tabIndex={numeric ? 0 : -1}
          maxLength={numeric ? maxDigitsFor(numeric.kind) : 4}
          value={draft}
          placeholder={numeric ? toDigits(numeric.kind, values[numeric.key]) : ""}
          onChange={(e) => {
            if (!numeric) return;
            const digits = e.target.value
              .replace(/\D/g, "")
              .slice(0, maxDigitsFor(numeric.kind));
            // No auto-advance: the parsed value below has to be readable
            // before moving on.
            setDraft(digits);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitAndNext(draft);
            }
          }}
          className={`w-full rounded-2xl border-2 bg-surface py-4 text-center text-4xl font-bold tracking-[0.3em] tabular-nums text-text outline-none placeholder:text-text-muted/30 ${
            invalid ? "border-accent-red" : "border-primary/40 focus:border-primary"
          }`}
        />
        {numeric && (
          <p
            className={`text-center ${
              invalid
                ? "text-sm text-accent-red"
                : draft === ""
                  ? "text-sm text-text-muted"
                  : "text-2xl font-bold text-primary"
            }`}
          >
            {invalid
              ? "この値は入力できません"
              : formatDigitValue(numeric.kind, draftValue ?? values[numeric.key])}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className="flex-1 rounded-xl border border-border bg-surface py-3 font-medium text-text transition-colors hover:bg-surface-hover"
          >
            戻る
          </button>
        )}
        {step < CONFIRM_STEP ? (
          <button
            type="button"
            onClick={() => commitAndNext(draft)}
            disabled={invalid}
            className="flex-1 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            {draft === "" && step > 0 ? "そのまま次へ" : "次へ"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
          >
            {saving && <Spinner className="text-white" />}
            {saving ? "保存中..." : "保存する"}
          </button>
        )}
      </div>

      {step === CONFIRM_STEP && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-text-muted underline"
          >
            朝ログを取り消す
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-hover"
      >
        <span className="text-sm text-text-muted">{label}</span>
        <span className="font-bold tabular-nums text-text">{value}</span>
      </button>
    </li>
  );
}
