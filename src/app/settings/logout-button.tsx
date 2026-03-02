"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-xl border border-accent-red/30 bg-accent-red/10 py-3 text-sm font-medium text-accent-red transition-colors hover:bg-accent-red/20"
    >
      ログアウト
    </button>
  );
}
