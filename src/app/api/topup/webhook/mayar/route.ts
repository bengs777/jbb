/**
 * POST /api/topup/webhook/mayar
 *
 * Mayar.id callback setelah user selesai bayar deposit saldo.
 * Idempotent: jika invoice sudah SUCCESS, return 200 tanpa proses ulang.
 *
 * Security:
 * - Verifikasi x-callback-token header (shared secret)
 * - Hanya proses status "paid" / "settlement"
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { topupTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyMayarWebhook, normalizeMayarStatus, normalizeMayarWebhookPayload } from "@/lib/mayar";
import { mutatBalance } from "@/lib/balance";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // 1. Verify signature/token
  if (!verifyMayarWebhook(req.headers)) {
    logger.warn("[webhook:mayar] invalid token", {
      ip: req.headers.get("x-forwarded-for"),
    });
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
    logger.warn("[webhook:mayar] invalid payload missing transaction id");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  logger.info("[webhook:mayar] received", {
    mayarId: payload.id,
    status: payload.status,
    amount: payload.amount,
    referenceId: payload.referenceId,
  });

  const invoiceId = payload.referenceId;
  if (!invoiceId) {
    logger.warn("[webhook:mayar] no referenceId in payload");
    return NextResponse.json({ ok: true }); // acknowledge, ignore
  }

  // 2. Load transaksi
  const [trx] = await db
    .select()
    .from(topupTransactions)
    .where(eq(topupTransactions.invoice_id, invoiceId))
    .limit(1);

  if (!trx) {
    logger.warn("[webhook:mayar] transaction not found", { invoiceId });
    return NextResponse.json({ ok: true }); // acknowledge
  }

  // 3. Idempotency — sudah diproses
  if (trx.status !== "WAITING_PAYMENT") {
    logger.info("[webhook:mayar] already processed", {
      invoiceId,
      status: trx.status,
    });
    return NextResponse.json({ ok: true });
  }

  const normalized = normalizeMayarStatus(payload.status);

  if (normalized === "PAID") {
    // 4. Credit saldo user
    await db
      .update(topupTransactions)
      .set({
        status: "SUCCESS",
        mayar_payment_id: payload.id,
        mayar_paid_at: payload.paidAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where(eq(topupTransactions.invoice_id, invoiceId));

    await mutatBalance({
      userId: trx.user_id,
      amount: trx.price,  // deposit full masuk saldo
      type: "TOPUP_IN",
      note: `Deposit via Mayar ${payload.id}`,
      topupTrxId: trx.id,
    });

    logger.info("[webhook:mayar] deposit credited", {
      userId: trx.user_id,
      invoiceId,
      amount: trx.price,
    });
  } else if (normalized === "EXPIRED" || normalized === "FAILED") {
    await db
      .update(topupTransactions)
      .set({
        status: "FAILED",
        failure_reason: `Mayar status: ${payload.status}`,
        updated_at: new Date().toISOString(),
      })
      .where(eq(topupTransactions.invoice_id, invoiceId));

    logger.info("[webhook:mayar] deposit expired/failed", { invoiceId });
  }

  return NextResponse.json({ ok: true });
}
