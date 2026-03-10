/**
 * Cron job for expiring unpaid orders.
 * Can be run standalone: npm run cron
 * Or registered in the Next.js app for background processing.
 */
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";

export async function expireOrders(): Promise<number> {
  const now = new Date().toISOString();

  // Find all UNPAID orders past their expiry
  const expiredOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status_pembayaran, "UNPAID"),
        lt(orders.expired_at, now)
      )
    );

  if (expiredOrders.length === 0) return 0;

  let count = 0;
  for (const order of expiredOrders) {
    try {
      // Run in a transaction: expire order + restore stock
      await db.transaction(async (tx) => {
        // Update order status
        await tx
          .update(orders)
          .set({
            status_pembayaran: "EXPIRED",
            updated_at: now,
          })
          .where(eq(orders.id, order.id));

        // Restore product stock
        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.order_id, order.id));

        for (const item of items) {
          await tx
            .update(products)
            .set({
              stok: sql`${products.stok} + ${item.qty}`,
              updated_at: now,
            })
            .where(eq(products.id, item.product_id));
        }
      });

      count++;
      console.log(`[cron] Order ${order.id} expired, stok dikembalikan`);
    } catch (err) {
      console.error(`[cron] Gagal expire order ${order.id}:`, err);
    }
  }

  return count;
}

// ─── STANDALONE RUNNER ────────────────────────────────────────────────────────
// This file is imported by the Next.js app and also runnable as a standalone script.
// The standalone runner is handled by src/lib/cron.ts — no require() needed here.
