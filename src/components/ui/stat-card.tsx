export function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-1 text-xs text-text-muted">{label}</p>
      <p className={`text-2xl font-bold ${color ?? ""}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}
