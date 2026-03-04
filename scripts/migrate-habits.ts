import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

async function main() {
  console.log("Adding new habit columns...");
  await sql`ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "socializing" boolean DEFAULT false`;
  await sql`ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "bathing" boolean DEFAULT false`;
  await sql`ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "intense_focus" boolean DEFAULT false`;
  await sql`ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "reading" boolean DEFAULT false`;
  await sql`ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "late_meal" boolean DEFAULT false`;

  console.log("Removing late_screen column...");
  await sql`ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "late_screen"`;

  console.log("Migration complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
