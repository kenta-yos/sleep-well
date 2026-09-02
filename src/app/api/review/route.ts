import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { aiInsights } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import {
  getMonthlyData,
  getMonthlyInsight,
  getPreviousMonthlyInsights,
} from "@/lib/db/queries";
import { generateMonthlySummary, createSummaryStream } from "@/lib/ai";

export const maxDuration = 300;

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

    const previousSummaries = await getPreviousMonthlyInsights(year, month);
    const prompt = generateMonthlySummary(sleep, logs, year, month, previousSummaries);

    const stream = createSummaryStream(prompt);
    let fullContent = "";

    // Resolved when stream is done
    let resolveStreamDone: () => void;
    const streamDone = new Promise<void>((r) => { resolveStreamDone = r; });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullContent += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (e) {
          console.error("Stream error:", e);
        } finally {
          controller.close();
          resolveStreamDone!();
        }
      },
    });

    // Save to DB after response is sent, using after() so Vercel
    // keeps the function alive for the DB write
    after(async () => {
      await streamDone;
      if (fullContent.length > 0) {
        try {
          const pad = (n: number) => String(n).padStart(2, "0");
          await db
            .insert(aiInsights)
            .values({
              date: `${year}-${pad(month)}-01`,
              type: "monthly",
              content: fullContent,
            })
            .onConflictDoUpdate({
              target: [aiInsights.date, aiInsights.type],
              set: { content: sql`excluded.content`, updatedAt: sql`now()` },
            });
        } catch (e) {
          console.error("Failed to save summary to DB:", e);
        }
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
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
