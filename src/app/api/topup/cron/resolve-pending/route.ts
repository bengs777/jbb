/**
 * GET /api/topup/cron/resolve-pending
 *
 * Cron job yang berjalan tiap 5 menit untuk:
 * 1. Polling status transaksi PENDING ke PortalPulsa
 * 2. Expire transaksi yang sudah melewati expired_at
 * 3. Sync cache produk dari PP (jika ada flag ?sync_products=true)
 *
 * Protect via CRON_SECRET header atau Vercel Cron:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Vercel cron.json: { "crons": [{ "path": "/api/topup/cron/resolve-pending", "schedule": "every 5 minutes" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { topupProducts, topupTransactions } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { checkOrderStatus, getProducts, calculateSellPrice } from "@/lib/portalpulsa";
import { mutatBalance } from "@/lib/balance";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const syncProducts = searchParams.get("sync_products") === "true";
  const now = new Date().toISOString();

  const results = {
    resolved: 0,
    expired: 0,
    productsSynced: 0,
  };

  // ─── 1. Expire transaksi yang sudah melewati expired_at ───────────────────
  const expiredRows = await db
    .select({ id: topupTransactions.id, user_id: topupTransactions.user_id, price: topupTransactions.price, invoice_id: topupTransactions.invoice_id })
    .from(topupTransactions)
    .where(
      and(
        eq(topupTransactions.status, "PENDING"),
        lt(topupTransactions.expired_at, now)
      )
    );

  for (const row of expiredRows) {
    try {
      await db
        .update(topupTransactions)
        .set({ status: "FAILED", failure_reason: "Expired", updated_at: now })
        .where(eq(topupTransactions.id, row.id));

      await mutatBalance({
        userId: row.user_id,
        amount: row.price,
        type: "REFUND",
        note: `Refund expired ${row.invoice_id}`,
        topupTrxId: row.id,
      });

      results.expired++;
      logger.info("[cron] expired+refunded", { invoiceId: row.invoice_id });
    } catch (e) {
      logger.error("[cron] expire failed", { id: row.id, error: String(e) });
    }
  }

  // ─── 2. Poll status transaksi PENDING yang belum expired ─────────────────
  const pendingRows = await db
    .select()
    .from(topupTransactions)
    .where(eq(topupTransactions.status, "PENDING"))
    .limit(50); // batch max 50 per run

  for (const row of pendingRows) {
    if (!row.portalpulsa_trxid) continue;
    if (row.retry_count >= 10) {
      // Max retry exceeded — refund
      await db
        .update(topupTransactions)
        .set({ status: "FAILED", failure_reason: "Max retry exceeded", updated_at: now })
        .where(eq(topupTransactions.id, row.id));
      await mutatBalance({
        userId: row.user_id,
        amount: row.price,
        type: "REFUND",
        note: `Refund max retry ${row.invoice_id}`,
        topupTrxId: row.id,
      });
      continue;
    }

    try {
      const status = await checkOrderStatus(row.portalpulsa_trxid);

      if (status.status === "success") {
        await db
          .update(topupTransactions)
          .set({
            status: "SUCCESS",
            portalpulsa_sn: status.sn ?? null,
            portalpulsa_rc: status.rc,
            portalpulsa_message: status.message,
            updated_at: now,
          })
          .where(eq(topupTransactions.id, row.id));

        await mutatBalance({
          userId: row.user_id,
          amount: -row.price,
          type: "ORDER_DEBIT",
          note: `Debit poll sukses ${row.invoice_id}`,
          topupTrxId: row.id,
        });

        results.resolved++;
        logger.info("[cron] resolved success", { invoiceId: row.invoice_id });
      } else if (status.status === "failed") {
        await db
          .update(topupTransactions)
          .set({
            status: "FAILED",
            portalpulsa_rc: status.rc,
            portalpulsa_message: status.message,
            failure_reason: status.message,
            updated_at: now,
          })
          .where(eq(topupTransactions.id, row.id));

        await mutatBalance({
          userId: row.user_id,
          amount: row.price,
          type: "REFUND",
          note: `Refund poll gagal ${row.invoice_id}`,
          topupTrxId: row.id,
        });

        results.resolved++;
        logger.info("[cron] resolved failed+refunded", { invoiceId: row.invoice_id });
      } else {
        // Still pending — increment retry count
        await db
          .update(topupTransactions)
          .set({
            retry_count: sql`${topupTransactions.retry_count} + 1`,
            updated_at: now,
          })
          .where(eq(topupTransactions.id, row.id));
      }
    } catch (e) {
      logger.error("[cron] poll error", { id: row.id, error: String(e) });
    }
  }

  // ─── 3. Sync produk (opsional) ────────────────────────────────────────────
  if (syncProducts) {
    try {
      const products = await getProducts();
      for (const p of products) {
        const sellPrice = calculateSellPrice(p.price);
        await db
          .insert(topupProducts)
          .values({
            code: p.code,
            name: p.name,
            category: p.category,
            operator: p.operator,
            price: sellPrice,
            cost: p.price,
            status: p.status,
          })
          .onConflictDoUpdate({
            target: topupProducts.code,
            set: {
              name: p.name,
              price: sellPrice,
              cost: p.price,
              status: p.status,
              synced_at: new Date().toISOString(),
            },
          });
        results.productsSynced++;
      }
      logger.info("[cron] products synced", { count: results.productsSynced });
    } catch (e) {
      logger.error("[cron] products sync failed", { error: String(e) });
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
