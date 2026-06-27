import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyLogs } from "@/lib/db/schema";
import { sql, desc, SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const mode = req.nextUrl.searchParams.get("mode") === "or" ? "or" : "and";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const keywords = q.split(/\s+/).filter((k) => k.length > 0);
  if (keywords.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const conditions = keywords.map(
    (k) => sql`${dailyLogs.note} ILIKE ${"%" + k + "%"}`
  );

  const combined: SQL =
    mode === "or"
      ? sql.join(conditions, sql` OR `)
      : sql.join(conditions, sql` AND `);

  const results = await db
    .select({
      date: dailyLogs.date,
      note: dailyLogs.note,
    })
    .from(dailyLogs)
    .where(sql`(${combined})`)
    .orderBy(desc(dailyLogs.date))
    .limit(30);

  return NextResponse.json({ results });
}
