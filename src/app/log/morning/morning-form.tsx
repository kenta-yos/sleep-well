"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmojiPicker } from "@/components/log/emoji-picker";
import { DigitInput } from "@/components/log/digit-input";
import { SleepStageBar } from "@/components/wizard/sleep-stage-bar";
import { Spinner } from "@/components/ui/spinner";
import { Toast, useToast } from "@/components/ui/toast";
import { getDefaultTimes } from "@/lib/sleep-utils";

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

export function MorningForm({
  date,
  initialData,
}: {
  date: string;
  initialData: InitialData | null;
}) {
  const router = useRouter();
  const defaults = getDefaultTimes();

  const initialBedtime = parseTime(initialData?.bedtime ?? null, defaults.bedtime);
  const initialWakeTime = parseTime(initialData?.wakeTime ?? null, defaults.wakeTime);

  const [freshnessScore, setFreshnessScore] = useState<number | null>(
    initialData?.freshnessScore ?? null
  );
  const [bedtime, setBedtime] = useState(initialBedtime);
  const [wakeTime, setWakeTime] = useState(initialWakeTime);
  const [totalSleepMinutes, setTotalSleepMinutes] = useState(
    initialData?.totalSleepMinutes ?? defaults.totalSleepMinutes
  );
  const [deepMinutes, setDeepMinutes] = useState(
    initialData?.deepMinutes ?? defaults.deepMinutes
  );
  const [lightMinutes, setLightMinutes] = useState(
    initialData?.lightMinutes ?? defaults.lightMinutes
  );
  const [remMinutes, setRemMinutes] = useState(
    initialData?.remMinutes ?? defaults.remMinutes
  );
  const [avgHeartRate, setAvgHeartRate] = useState(
    initialData?.avgHeartRate ?? defaults.avgHeartRate
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast, showToast } = useToast();

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          bedtime: formatTime(bedtime),
          wakeTime: formatTime(wakeTime),
          totalSleepMinutes,
          deepMinutes,
          lightMinutes,
          remMinutes,
          avgHeartRate,
          freshnessScore,
        }),
      });

      if (res.ok) {
        setSaved(true);
        showToast("保存しました");
        router.refresh();
      } else {
        // Used to fail silently: the button just stopped spinning.
        showToast("保存に失敗しました", "error");
      }
    } catch {
      showToast("保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setFreshnessScore(initialData?.freshnessScore ?? null);
    setBedtime(initialBedtime);
    setWakeTime(initialWakeTime);
    setTotalSleepMinutes(initialData?.totalSleepMinutes ?? defaults.totalSleepMinutes);
    setDeepMinutes(initialData?.deepMinutes ?? defaults.deepMinutes);
    setLightMinutes(initialData?.lightMinutes ?? defaults.lightMinutes);
    setRemMinutes(initialData?.remMinutes ?? defaults.remMinutes);
    setAvgHeartRate(initialData?.avgHeartRate ?? defaults.avgHeartRate);
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Freshness */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">すっきり度</h3>
        <EmojiPicker value={freshnessScore} onChange={setFreshnessScore} />
      </section>

      <hr className="border-border" />

      {/* Total sleep */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">総睡眠時間</h3>
        <DigitInput
          kind="duration"
          value={totalSleepMinutes}
          onChange={setTotalSleepMinutes}
          min={60}
          max={720}
          label="睡眠時間"
        />
      </section>

      <hr className="border-border" />

      {/* Sleep stages */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-text-muted">睡眠ステージ</h3>
        <SleepStageBar deep={deepMinutes} light={lightMinutes} rem={remMinutes} />
        <div className="space-y-2">
          <DigitInput
            kind="duration"
            value={remMinutes}
            onChange={setRemMinutes}
            min={0}
            max={240}
            label="REM睡眠"
          />
          <DigitInput
            kind="duration"
            value={lightMinutes}
            onChange={setLightMinutes}
            min={0}
            max={480}
            label="浅い睡眠"
          />
          <DigitInput
            kind="duration"
            value={deepMinutes}
            onChange={setDeepMinutes}
            min={0}
            max={300}
            label="深い睡眠"
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* Bedtime / Wake time */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">就寝・起床時刻</h3>
        <div className="space-y-2">
          <DigitInput
            kind="clock"
            value={bedtime}
            onChange={setBedtime}
            label="就寝"
          />
          <DigitInput
            kind="clock"
            value={wakeTime}
            onChange={setWakeTime}
            label="起床"
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* Heart rate */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">平均心拍数</h3>
        <DigitInput
          kind="count"
          value={avgHeartRate}
          onChange={setAvgHeartRate}
          min={30}
          max={120}
          label="平均心拍数"
          unit="bpm"
        />
      </section>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
      >
        {saving && <Spinner className="text-white" />}
        {saving ? "保存中..." : "保存する"}
      </button>
      {saved && !saving && (
        <p className="text-center text-sm text-accent-green">保存しました</p>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-text-muted underline"
        >
          朝ログを取り消す
        </button>
      </div>
    </div>
  );
}
