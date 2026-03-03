/**
 * Standalone cron runner — npm run cron
 * Runs in a separate process (or pm2/systemd) every minute
 */
import "dotenv/config";
import cron from "node-cron";
import { expireOrders } from "./expire";

console.log("⏰ JBB Cron runner started");

cron.schedule("* * * * *", async () => {
  try {
    await expireOrders();
  } catch (e) {
    console.error("Cron error:", e);
  }
});
