import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiInsights } from "@/lib/db/schema";
import { getMonthlyData, getMonthlyInsight } from "@/lib/db/queries";
import { generateMonthlySummary } from "@/lib/ai";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!year || !month) {
    return NextResponse.json(
      { error: "year と month が必要です" },
      { status: 400 }
    );
  }

  const insight = await getMonthlyInsight(year, month);
  return NextResponse.json({
    content: insight?.content ?? null,
    date: insight?.date ?? null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { year, month } = await req.json();

    if (!year || !month) {
      return NextResponse.json(
        { error: "year と month が必要です" },
        { status: 400 }
      );
    }

    const { sleep, logs } = await getMonthlyData(year, month);

    if (sleep.length === 0) {
      return NextResponse.json(
        { error: "その月の睡眠データがありません" },
        { status: 404 }
      );
    }

    const content = await generateMonthlySummary(sleep, logs, year, month);

    const pad = (n: number) => String(n).padStart(2, "0");
    await db.insert(aiInsights).values({
      date: `${year}-${pad(month)}-01`,
      type: "monthly",
      content,
    });

    return NextResponse.json({ content });
  } catch (e) {
    console.error("Monthly review generation failed:", e);
    const message =
      e instanceof Error ? e.message : "不明なエラーが発生しました";
    return NextResponse.json(
      { error: `生成に失敗しました: ${message}` },
      { status: 500 }
    );
  }
}
