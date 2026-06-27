import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyLogs } from "@/lib/db/schema";
import { sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await db
    .select({
      date: dailyLogs.date,
      note: dailyLogs.note,
    })
    .from(dailyLogs)
    .where(sql`${dailyLogs.note} ILIKE ${"%" + q + "%"}`)
    .orderBy(desc(dailyLogs.date))
    .limit(30);

  return NextResponse.json({ results });
}
