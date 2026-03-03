/**
 * Custom migrate script — runs generated SQL against Turso
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf-8");
    const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
    console.log(`\n📄 Running ${file} (${statements.length} statements)`);
    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (e: any) {
        if (e.message?.includes("already exists")) {
          console.log(`  ⏭️  Skipped (already exists)`);
        } else {
          console.error(`  ❌ ${e.message}`);
        }
      }
    }
  }
  console.log("\n✅ Migration complete!");
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
