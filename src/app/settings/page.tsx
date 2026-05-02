export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">設定</h1>
      <p className="text-center text-xs text-text-muted">Sleep Well v0.1.0</p>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      className="h-4 w-4 text-text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
