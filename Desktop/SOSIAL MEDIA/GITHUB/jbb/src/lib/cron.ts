/**
 * Standalone cron runner — npm run cron
 * Runs in a separate process (or pm2/systemd) every minute
 */
import "dotenv/config";
import cron from "node-cron";
import { expireOrders } from "./expire";

import { syncPortalPulsaProducts } from "./sync-portalpulsa";

console.log("⏰ JBB Cron runner started");

cron.schedule("* * * * *", async () => {
  try {
    await expireOrders();
  } catch (e) {
    console.error("Cron error:", e);
  }
});

// Sync PortalPulsa products every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const count = await syncPortalPulsaProducts();
    console.log(`[cron] Synced ${count} PortalPulsa products`);
  } catch (e) {
    console.error("[cron] PortalPulsa sync error:", e);
  }
});
