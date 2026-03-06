import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

async function main() {
  // Step 1: Convert existing stress_sources from JSON array to JSON object
  // e.g. ["work", "health"] → {"work": 1, "health": 1}
  console.log("Converting stress_sources from array to object...");
  const rows = await sql`
    SELECT id, stress_sources FROM daily_logs
    WHERE stress_sources IS NOT NULL
  `;

  let converted = 0;
  for (const row of rows) {
    const sources = row.stress_sources;
    // Only convert if it's an array (not already an object)
    if (Array.isArray(sources)) {
      const obj: Record<string, number> = {};
      for (const s of sources) {
        obj[s] = 1;
      }
      await sql`
        UPDATE daily_logs SET stress_sources = ${JSON.stringify(obj)}::json
        WHERE id = ${row.id}
      `;
      converted++;
    }
  }
  console.log(`Converted ${converted} rows`);

  // Step 2: Drop stress_score column
  console.log("Dropping stress_score column...");
  await sql`ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "stress_score"`;

  console.log("Migration complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
