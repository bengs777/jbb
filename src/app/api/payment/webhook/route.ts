import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, sellerEarnings, kurirEarnings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/api-helpers";
import { verifyMayarWebhook, normalizeMayarStatus, normalizeMayarWebhookPayload } from "@/lib/mayar";
import { classifyEarnings } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = normalizeMayarWebhookPayload(rawBody);

    // 1. Verify webhook token via x-callback-token header
    if (!verifyMayarWebhook(req.headers)) {
      console.warn("[webhook] Invalid token, order:", body.referenceId ?? body.id);
      return err("Token tidak valid", 400);
    }

    const internalStatus = normalizeMayarStatus(body.status ?? "");
    const transaction_id: string = body.id;
    const paid_at: string = body.paidAt ?? new Date().toISOString();

    if (!transaction_id) {
      console.warn("[webhook] Missing transaction id", rawBody);
      return err("Payload Mayar tidak valid", 400);
    }

    if (internalStatus !== "PAID") {
      console.log(`[webhook] Status ${body.status} untuk tx ${transaction_id} — diabaikan`);
      return ok({ message: `Status ${body.status}, diabaikan` });
    }

    // 2. Resolve order — prefer referenceId, fallback to qris_id lookup
    let order_id: string | undefined = body.referenceId || undefined;
    let order: any = undefined;

    if (order_id) {
      const rows = await db.select().from(orders).where(eq(orders.id, order_id));
      order = rows[0];
    }

    // Fallback: look up by Mayar transaction_id stored in qris_id
    if (!order) {
      const rows = await db.select().from(orders).where(eq(orders.qris_id, transaction_id));
      order = rows[0];
      if (order) order_id = order.id;
    }

    if (!order) {
      console.warn("[webhook] Order tidak ditemukan untuk tx:", transaction_id, "ref:", body.referenceId);
      return err("Order tidak ditemukan", 404);
    }

    // 3. Idempotency: skip if already PAID
    if (order.status_pembayaran === "PAID") {
      return ok({ message: "Order sudah PAID sebelumnya" });
    }

    // 4. Check not expired
    if (order.status_pembayaran === "EXPIRED") {
      return err("Order sudah EXPIRED", 400);
    }

    const now = new Date().toISOString();
    const resolvedOrderId = order_id!;

    // 5. Atomic: update order + generate earnings
    await db.transaction(async (tx) => {
      // Mark order as PAID
      await tx
        .update(orders)
        .set({
          status_pembayaran: "PAID",
          updated_at: now,
        })
        .where(eq(orders.id, resolvedOrderId));

      // Generate Seller Earning
      const sellerAmount = order.total_produk;
      await tx.insert(sellerEarnings).values({
        id: crypto.randomUUID(),
        seller_id: order.seller_id,
        order_id: resolvedOrderId,
        jumlah: sellerAmount,
        tanggal: paid_at ?? now,
        klasifikasi: classifyEarnings(sellerAmount),
      });

      // Generate Kurir Earning (if kurir assigned)
      if (order.kurir_id) {
        await tx.insert(kurirEarnings).values({
          id: crypto.randomUUID(),
          kurir_id: order.kurir_id,
          order_id: resolvedOrderId,
          fee_kurir: order.fee_kurir,
          tanggal: paid_at ?? now,
          klasifikasi: classifyEarnings(order.fee_kurir),
        });
      }
    });

    console.log(`[webhook] Order ${resolvedOrderId} PAID. tx: ${transaction_id}`);
    return ok({ message: "Pembayaran dikonfirmasi" });
  } catch (e) {
    console.error("[POST /api/payment/webhook]", e);
    return err("Webhook gagal diproses", 500);
  }
}
