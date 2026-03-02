"use client";

import { useState } from "react";
import { importCSVAction } from "@/actions/import-actions";

export default function ImportPage() {
  const [result, setResult] = useState<{
    error: string | null;
    count: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const res = await importCSVAction(formData);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">CSVインポート</h1>
      <p className="text-sm text-text-muted">
        Mi FitnessからエクスポートしたCSVファイルをアップロードしてください
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            集約データ (aggregated_fitness_data.csv)
            <span className="text-accent-red">*</span>
          </label>
          <input
            type="file"
            name="aggregated"
            accept=".csv"
            required
            className="block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:text-text hover:file:bg-surface-hover"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            詳細データ (fitness_data.csv)
            <span className="ml-1 text-xs text-text-muted">任意</span>
          </label>
          <input
            type="file"
            name="detailed"
            accept=".csv"
            className="block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:text-text hover:file:bg-surface-hover"
          />
          <p className="text-xs text-text-muted">
            詳細な睡眠ステージ情報を取り込みます
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "インポート中..." : "インポート"}
        </button>
      </form>

      {result && (
        <div
          className={`rounded-xl p-4 ${
            result.error
              ? "border border-accent-red/30 bg-accent-red/10 text-accent-red"
              : "border border-accent-green/30 bg-accent-green/10 text-accent-green"
          }`}
        >
          {result.error ?? `${result.count}件の睡眠レコードをインポートしました`}
        </div>
      )}
    </div>
  );
}
