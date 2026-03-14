"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmojiPicker } from "@/components/log/emoji-picker";
import { TimeWheelPicker } from "@/components/wizard/wheel-picker";
import { Stepper } from "@/components/wizard/stepper";
import { SleepStageBar } from "@/components/wizard/sleep-stage-bar";
import { Spinner } from "@/components/ui/spinner";
import { formatMinutesAsHM, getDefaultTimes } from "@/lib/sleep-utils";

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

export function MorningForm({
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

  const [freshnessScore, setFreshnessScore] = useState<number | null>(
    initialData?.freshnessScore ?? null
  );
  const [bedtimeH, setBedtimeH] = useState(bedParsed.h);
  const [bedtimeM, setBedtimeM] = useState(bedParsed.m);
  const [wakeH, setWakeH] = useState(wakeParsed.h);
  const [wakeM, setWakeM] = useState(wakeParsed.m);
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

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const bedtime = `${String(bedtimeH).padStart(2, "0")}:${String(bedtimeM).padStart(2, "0")}`;
    const wakeTime = `${String(wakeH).padStart(2, "0")}:${String(wakeM).padStart(2, "0")}`;

    try {
      const res = await fetch("/api/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          bedtime,
          wakeTime,
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
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setFreshnessScore(initialData?.freshnessScore ?? null);
    setBedtimeH(bedParsed.h);
    setBedtimeM(bedParsed.m);
    setWakeH(wakeParsed.h);
    setWakeM(wakeParsed.m);
    setTotalSleepMinutes(initialData?.totalSleepMinutes ?? defaults.totalSleepMinutes);
    setDeepMinutes(initialData?.deepMinutes ?? defaults.deepMinutes);
    setLightMinutes(initialData?.lightMinutes ?? defaults.lightMinutes);
    setRemMinutes(initialData?.remMinutes ?? defaults.remMinutes);
    setAvgHeartRate(initialData?.avgHeartRate ?? defaults.avgHeartRate);
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      {/* Freshness */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">すっきり度</h3>
        <EmojiPicker value={freshnessScore} onChange={setFreshnessScore} />
      </section>

      <hr className="border-border" />

      {/* Total sleep */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">総睡眠時間</h3>
        <Stepper
          value={totalSleepMinutes}
          onChange={setTotalSleepMinutes}
          min={60}
          max={720}
          step={5}
          label="睡眠時間"
          formatValue={formatMinutesAsHM}
        />
      </section>

      <hr className="border-border" />

      {/* Sleep stages */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-text-muted">睡眠ステージ</h3>
        <SleepStageBar deep={deepMinutes} light={lightMinutes} rem={remMinutes} />
        <div className="space-y-2">
          <Stepper
            value={remMinutes}
            onChange={setRemMinutes}
            min={0}
            max={240}
            step={5}
            label="REM睡眠"
            formatValue={formatMinutesAsHM}
          />
          <Stepper
            value={lightMinutes}
            onChange={setLightMinutes}
            min={0}
            max={480}
            step={5}
            label="浅い睡眠"
            formatValue={formatMinutesAsHM}
          />
          <Stepper
            value={deepMinutes}
            onChange={setDeepMinutes}
            min={0}
            max={300}
            step={5}
            label="深い睡眠"
            formatValue={formatMinutesAsHM}
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* Bedtime / Wake time */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">就寝・起床時刻</h3>
        <div className="flex justify-center gap-8">
          <TimeWheelPicker
            hours={bedtimeH}
            minutes={bedtimeM}
            onChangeHours={setBedtimeH}
            onChangeMinutes={setBedtimeM}
            label="就寝"
          />
          <TimeWheelPicker
            hours={wakeH}
            minutes={wakeM}
            onChangeHours={setWakeH}
            onChangeMinutes={setWakeM}
            label="起床"
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* Heart rate */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">平均心拍数</h3>
        <Stepper
          value={avgHeartRate}
          onChange={setAvgHeartRate}
          min={30}
          max={120}
          step={1}
          label="平均心拍数"
          unit="bpm"
        />
      </section>

      {/* Save / Cancel buttons */}
      <div className="flex gap-3 pb-4">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 rounded-xl border border-border bg-surface py-3 font-medium text-text transition-colors hover:bg-surface-hover"
        >
          取り消す
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
        >
          {saving && <Spinner className="text-white" />}
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>

      {saved && !saving && (
        <p className="text-center text-sm text-accent-green">保存しました</p>
      )}
    </div>
  );
}
