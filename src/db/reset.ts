import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const JBB_TABLES = [
  "cart_items", "order_items", "kurir_earnings", "seller_earnings",
  "orders", "products", "verifications", "accounts", "sessions", "users",
];

async function reset() {
  console.log("🗑️  Dropping JBB tables...");
  for (const t of JBB_TABLES) {
    try {
      await client.execute(`DROP TABLE IF EXISTS "${t}"`);
      console.log(`  ✅ Dropped: ${t}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ⚠️  ${t}: ${msg}`);
    }
  }
  console.log("\nDone — run npm run db:migrate to recreate");
  process.exit(0);
}

reset().catch(e => { console.error(e); process.exit(1); });
