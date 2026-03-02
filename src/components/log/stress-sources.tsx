"use client";

const sources = [
  { id: "work", label: "仕事" },
  { id: "friends", label: "友人関係" },
  { id: "romance", label: "恋愛" },
  { id: "health", label: "体調・健康" },
  { id: "money", label: "金銭" },
  { id: "future", label: "将来・生き方" },
  { id: "other", label: "その他" },
];

export function StressSources({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (sources: string[]) => void;
}) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map(({ id, label }) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className={`min-h-[44px] rounded-xl border-2 px-3 py-2 text-sm transition-all ${
              isSelected
                ? "border-accent-purple bg-accent-purple/15 text-text"
                : "border-border bg-surface text-text-muted"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
