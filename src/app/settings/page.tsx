import { ExportButton } from "./export-button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">設定</h1>

      <div className="space-y-3">
        <ExportButton />
      </div>

      <p className="text-center text-xs text-text-muted">Sleep Well v0.1.0</p>
    </div>
  );
}
