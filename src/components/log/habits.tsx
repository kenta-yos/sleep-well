export const HABITS = [
  { key: "exercise", label: "運動", icon: "M3 12h4l3-8 4 16 3-8h4" },
  { key: "alcohol", label: "飲酒", icon: "M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v7M8 21h8" },
  {
    key: "socializing",
    label: "交流",
    icon: "M6 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 20a6 6 0 0 1 12 0M15 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M16 14a5 5 0 0 1 5 5",
  },
  { key: "bathing", label: "入浴", icon: "M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0" },
  { key: "intenseFocus", label: "集中", icon: "M5 5h14v11H5zM2 20h20" },
  {
    key: "reading",
    label: "読書",
    icon: "M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z",
  },
  { key: "lateMeal", label: "遅食", icon: "M7 3v18M5 3v4a2 2 0 0 0 4 0V3M17 21V3c-2 1-3 3-3 6s1 4 3 4" },
] as const;

export type HabitKey = (typeof HABITS)[number]["key"];

export function HabitIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

export const STRESS_CATEGORIES = [
  { id: "work", label: "仕事" },
  { id: "friends", label: "友人関係" },
  { id: "romance", label: "恋愛" },
  { id: "health", label: "体調・健康" },
  { id: "money", label: "金銭" },
  { id: "future", label: "将来・生き方" },
  { id: "other", label: "その他" },
] as const;

export const STRESS_LEVELS = [
  { value: 1, label: "低" },
  { value: 2, label: "中" },
  { value: 3, label: "高" },
] as const;
