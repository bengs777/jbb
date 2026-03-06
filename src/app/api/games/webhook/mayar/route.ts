/**
 * POST /api/games/webhook/mayar
 *
 * Mayar.id callback setelah user selesai bayar game voucher.
 * Idempotent: hanya proses jika status masih WAITING_PAYMENT.
 *
 * Flow:
 *   1. Verify token
 *   2. Temukan game order by invoiceId (prefix GAME-)
 *   3. Tandai PAID + hitung admin_profit (sell_price - buy_price)
 *   4. Kirim order ke PortalPulsa untuk deliver voucher
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyMayarWebhook, normalizeMayarStatus, normalizeMayarWebhookPayload } from "@/lib/mayar";
import { createOrder } from "@/lib/portalpulsa";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  if (!verifyMayarWebhook(req.headers)) {
    console.warn("[webhook:games/mayar] invalid token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ReturnType<typeof normalizeMayarWebhookPayload>;
  try {
    const raw = await req.json();
    payload = normalizeMayarWebhookPayload(raw);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const invoiceId = payload.referenceId;
  if (!invoiceId?.startsWith("GAME-")) {
    return NextResponse.json({ ok: true }); // bukan game order, abaikan
  }

  const [order] = await db
    .select()
    .from(gameOrders)
    .where(eq(gameOrders.invoice_id, invoiceId))
    .limit(1);

  if (!order) {
    console.warn("[webhook:games/mayar] order not found", invoiceId);
    return NextResponse.json({ ok: true });
  }

  if (order.status !== "WAITING_PAYMENT") {
    return NextResponse.json({ ok: true }); // idempotent
  }

  const normalizedStatus = normalizeMayarStatus(payload.status);
  const now = new Date().toISOString();

  if (normalizedStatus === "PAID") {
    const buyPrice = order.provider_buy_price ?? 0;
    const sellPrice = order.provider_sell_price ?? order.amount;
    const adminProfit = sellPrice - buyPrice;

    // Tandai PAID dulu (idempotency guard)
    await db
      .update(gameOrders)
      .set({
        status: "PAID",
        mayar_paid_at: now,
        updated_at: now,
        admin_profit: adminProfit,
        delivery_status: "PROCESSING",
      })
      .where(eq(gameOrders.id, order.id));

    logger.info("[webhook:games/mayar] PAID", {
      invoiceId,
      game: order.game_name,
      nominal: order.nominal_label,
      target: order.target_user_id,
      adminProfit,
    });

    // Deliver via PortalPulsa
    if (order.provider_product_code) {
      const targetNumber = order.target_server_id
        ? `${order.target_user_id}_${order.target_server_id}`
        : order.target_user_id;

      try {
        const ppRes = await createOrder({
          invoiceId: order.invoice_id,
          productCode: order.provider_product_code,
          targetNumber,
        });

        const deliveryStatus: "DELIVERED" | "PROCESSING" | "FAILED" =
          ppRes.status === "success" ? "DELIVERED"
          : ppRes.status === "pending" ? "PROCESSING"
          : "FAILED";

        await db
          .update(gameOrders)
          .set({
            pp_trxid: ppRes.trxId ?? null,
            pp_sn: ppRes.sn ?? null,
            pp_rc: ppRes.rc,
            pp_message: ppRes.message,
            delivery_status: deliveryStatus,
            updated_at: new Date().toISOString(),
          })
          .where(eq(gameOrders.id, order.id));

        logger.info("[webhook:games/mayar] PP delivery", {
          invoiceId,
          ppStatus: ppRes.status,
          rc: ppRes.rc,
          sn: ppRes.sn,
        });
      } catch (ppErr) {
        logger.error("[webhook:games/mayar] PP delivery failed", {
          invoiceId,
          error: String(ppErr),
        });
        await db
          .update(gameOrders)
          .set({ delivery_status: "FAILED", pp_message: String(ppErr).slice(0, 300), updated_at: new Date().toISOString() })
          .where(eq(gameOrders.id, order.id));
      }
    }
  } else if (normalizedStatus === "EXPIRED") {
    await db
      .update(gameOrders)
      .set({ status: "EXPIRED", updated_at: now })
      .where(eq(gameOrders.id, order.id));
  }

  return NextResponse.json({ ok: true });
}
