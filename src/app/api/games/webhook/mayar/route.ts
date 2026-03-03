/**
 * POST /api/games/webhook/mayar
 *
 * Mayar.id callback setelah user selesai bayar game voucher.
 * Idempotent: hanya proses jika status masih WAITING_PAYMENT.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyMayarWebhook, normalizeMayarStatus, normalizeMayarWebhookPayload } from "@/lib/mayar";

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
    await db
      .update(gameOrders)
      .set({
        status: "PAID",
        mayar_paid_at: now,
        updated_at: now,
      })
      .where(eq(gameOrders.id, order.id));

    console.log(`[webhook:games/mayar] PAID ${invoiceId} — ${order.game_name} ${order.nominal_label} for ${order.target_user_id}`);

    // TODO: di sini bisa trigger API game provider (Moota/DigiFlazz/dll)
    // untuk memproses pengiriman voucher secara otomatis
  } else if (normalizedStatus === "EXPIRED") {
    await db
      .update(gameOrders)
      .set({ status: "EXPIRED", updated_at: now })
      .where(eq(gameOrders.id, order.id));
  }

  return NextResponse.json({ ok: true });
}
