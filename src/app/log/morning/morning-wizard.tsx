"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressDots } from "@/components/wizard/progress-dots";
import { FreshnessSelector } from "@/components/wizard/freshness-selector";
import { TimeWheelPicker } from "@/components/wizard/wheel-picker";
import { Stepper } from "@/components/wizard/stepper";
import { SleepStageBar } from "@/components/wizard/sleep-stage-bar";
import { Spinner } from "@/components/ui/spinner";
import { formatMinutesAsHM, getDefaultTimes } from "@/lib/sleep-utils";

const TOTAL_STEPS = 6;

interface WizardData {
  freshnessScore: number | null;
  bedtimeH: number;
  bedtimeM: number;
  wakeH: number;
  wakeM: number;
  totalSleepMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  remMinutes: number;
  avgHeartRate: number;
}

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

function parseTime(t: string | null, defaultH: number, defaultM: number) {
  if (!t) return { h: defaultH, m: defaultM };
  const [h, m] = t.split(":").map(Number);
  return { h, m: Math.round(m / 5) * 5 };
}

export function MorningWizard({
  date,
  initialData,
}: {
  date: string;
  initialData: InitialData | null;
}) {
  const router = useRouter();
  const defaults = getDefaultTimes();

  const bedParsed = parseTime(initialData?.bedtime ?? null, 23, 30);
  const wakeParsed = parseTime(initialData?.wakeTime ?? null, 7, 0);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WizardData>({
    freshnessScore: initialData?.freshnessScore ?? null,
    bedtimeH: bedParsed.h,
    bedtimeM: bedParsed.m,
    wakeH: wakeParsed.h,
    wakeM: wakeParsed.m,
    totalSleepMinutes:
      initialData?.totalSleepMinutes ?? defaults.totalSleepMinutes,
    deepMinutes: initialData?.deepMinutes ?? defaults.deepMinutes,
    lightMinutes: initialData?.lightMinutes ?? defaults.lightMinutes,
    remMinutes: initialData?.remMinutes ?? defaults.remMinutes,
    avgHeartRate: initialData?.avgHeartRate ?? defaults.avgHeartRate,
  });

  function update<K extends keyof WizardData>(key: K, val: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: val }));
  }

  function canNext(): boolean {
    if (step === 0) return data.freshnessScore != null;
    return true;
  }

  function next() {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSave() {
    setSaving(true);
    const bedtime = `${String(data.bedtimeH).padStart(2, "0")}:${String(data.bedtimeM).padStart(2, "0")}`;
    const wakeTime = `${String(data.wakeH).padStart(2, "0")}:${String(data.wakeM).padStart(2, "0")}`;

    try {
      const res = await fetch("/api/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          bedtime,
          wakeTime,
          totalSleepMinutes: data.totalSleepMinutes,
          deepMinutes: data.deepMinutes,
          lightMinutes: data.lightMinutes,
          remMinutes: data.remMinutes,
          avgHeartRate: data.avgHeartRate,
          freshnessScore: data.freshnessScore,
        }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <ProgressDots total={TOTAL_STEPS} current={step} />

      <div className="flex-1 py-6">
        <div className="wizard-slide" key={step}>
          {step === 0 && <StepFreshness data={data} update={update} />}
          {step === 1 && <StepBedtime data={data} update={update} />}
          {step === 2 && <StepTotalSleep data={data} update={update} />}
          {step === 3 && <StepStages data={data} update={update} />}
          {step === 4 && <StepHeartRate data={data} update={update} />}
          {step === 5 && <StepConfirm data={data} />}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pb-4">
        {step > 0 && (
          <button
            type="button"
            onClick={prev}
            className="flex-1 rounded-xl border border-border bg-surface py-3 font-medium text-text transition-colors hover:bg-surface-hover"
          >
            戻る
          </button>
        )}

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!canNext()}
            className="flex-1 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            次へ
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
    </div>
  );
}

/* ---------- Step Components ---------- */

function StepFreshness({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold">起きたときの気分は？</h2>
        <p className="text-sm text-text-muted">すっきり度を選んでください</p>
      </div>
      <FreshnessSelector
        value={data.freshnessScore}
        onChange={(s) => update("freshnessScore", s)}
      />
    </div>
  );
}

function StepBedtime({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold">就寝・起床時刻</h2>
        <p className="text-sm text-text-muted">
          だいたいの時刻を選んでください
        </p>
      </div>
      <div className="flex justify-center gap-8">
        <TimeWheelPicker
          hours={data.bedtimeH}
          minutes={data.bedtimeM}
          onChangeHours={(h) => update("bedtimeH", h)}
          onChangeMinutes={(m) => update("bedtimeM", m)}
          label="就寝"
        />
        <TimeWheelPicker
          hours={data.wakeH}
          minutes={data.wakeM}
          onChangeHours={(h) => update("wakeH", h)}
          onChangeMinutes={(m) => update("wakeM", m)}
          label="起床"
        />
      </div>
    </div>
  );
}

function StepTotalSleep({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold">総睡眠時間</h2>
        <p className="text-sm text-text-muted">
          実際に眠れた時間（中途覚醒を除く）
        </p>
      </div>
      <Stepper
        value={data.totalSleepMinutes}
        onChange={(v) => update("totalSleepMinutes", v)}
        min={60}
        max={720}
        step={15}
        label="睡眠時間"
        formatValue={formatMinutesAsHM}
      />
    </div>
  );
}

function StepStages({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold">睡眠ステージ</h2>
        <p className="text-sm text-text-muted">
          わからなければそのままでOK
        </p>
      </div>
      <SleepStageBar
        deep={data.deepMinutes}
        light={data.lightMinutes}
        rem={data.remMinutes}
      />
      <div className="space-y-2">
        <Stepper
          value={data.deepMinutes}
          onChange={(v) => update("deepMinutes", v)}
          min={0}
          max={300}
          step={5}
          label="深い睡眠"
          formatValue={formatMinutesAsHM}
        />
        <Stepper
          value={data.lightMinutes}
          onChange={(v) => update("lightMinutes", v)}
          min={0}
          max={480}
          step={5}
          label="浅い睡眠"
          formatValue={formatMinutesAsHM}
        />
        <Stepper
          value={data.remMinutes}
          onChange={(v) => update("remMinutes", v)}
          min={0}
          max={240}
          step={5}
          label="REM睡眠"
          formatValue={formatMinutesAsHM}
        />
      </div>
    </div>
  );
}

function StepHeartRate({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold">心拍数</h2>
        <p className="text-sm text-text-muted">
          睡眠中の平均心拍数（わからなければスキップ）
        </p>
      </div>
      <Stepper
        value={data.avgHeartRate}
        onChange={(v) => update("avgHeartRate", v)}
        min={30}
        max={120}
        step={1}
        label="平均心拍数"
        unit="bpm"
      />
    </div>
  );
}

function StepConfirm({ data }: { data: WizardData }) {
  const bedtime = `${String(data.bedtimeH).padStart(2, "0")}:${String(data.bedtimeM).padStart(2, "0")}`;
  const wakeTime = `${String(data.wakeH).padStart(2, "0")}:${String(data.wakeM).padStart(2, "0")}`;

  const freshnessEmoji = ["", "😫", "😔", "😐", "😊", "😴"][
    data.freshnessScore ?? 0
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold">確認</h2>
        <p className="text-sm text-text-muted">内容を確認して保存</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <ConfirmRow
          label="すっきり度"
          value={
            data.freshnessScore
              ? `${freshnessEmoji} ${data.freshnessScore}/5`
              : "--"
          }
        />
        <ConfirmRow label="就寝" value={bedtime} />
        <ConfirmRow label="起床" value={wakeTime} />
        <ConfirmRow
          label="総睡眠"
          value={formatMinutesAsHM(data.totalSleepMinutes)}
        />
        <ConfirmRow
          label="深い睡眠"
          value={formatMinutesAsHM(data.deepMinutes)}
        />
        <ConfirmRow
          label="浅い睡眠"
          value={formatMinutesAsHM(data.lightMinutes)}
        />
        <ConfirmRow
          label="REM睡眠"
          value={formatMinutesAsHM(data.remMinutes)}
        />
        <ConfirmRow label="平均心拍" value={`${data.avgHeartRate} bpm`} />
      </div>

      <SleepStageBar
        deep={data.deepMinutes}
        light={data.lightMinutes}
        rem={data.remMinutes}
      />
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text">{value}</span>
    </div>
  );
}
