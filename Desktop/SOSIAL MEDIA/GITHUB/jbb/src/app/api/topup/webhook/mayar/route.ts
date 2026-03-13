/**
 * POST /api/topup/webhook/mayar
 *
 * Handles two types of Mayar callback:
 *
 * 1. Deposit (product_code === '__DEPOSIT__')
 *    → credit saldo user
 *
 * 2. Direct topup order (product_code !== '__DEPOSIT__')
 *    → execute PortalPulsa order, update transaction status
 *
 * Idempotent: re-delivered webhooks are safely ignored.
 * Security: x-callback-token header verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { topupTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyMayarWebhook, normalizeMayarStatus, normalizeMayarWebhookPayload } from "@/lib/mayar";
import { mutatBalance } from "@/lib/balance";
import { createOrder } from "@/lib/portalpulsa";
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

  // 3. Idempotency — already processed
  if (trx.status !== "WAITING_PAYMENT") {
    logger.info("[webhook:mayar] already processed", { invoiceId, status: trx.status });
    return NextResponse.json({ ok: true });
  }

  const normalized = normalizeMayarStatus(payload.status);

  if (normalized !== "PAID") {
    // Payment failed / expired — mark transaction accordingly
    await db
      .update(topupTransactions)
      .set({
        status: "FAILED",
        failure_reason: `Mayar status: ${payload.status}`,
        updated_at: new Date().toISOString(),
      })
      .where(eq(topupTransactions.invoice_id, invoiceId));
    logger.info("[webhook:mayar] payment not paid", { invoiceId, status: payload.status });
    return NextResponse.json({ ok: true });
  }

  // 4. Payment is PAID — branch on transaction type
  const now = new Date().toISOString();

  if (trx.product_code === "__DEPOSIT__") {
    // ── Deposit: credit saldo ────────────────────────────────────────────────
    await db
      .update(topupTransactions)
      .set({
        status: "SUCCESS",
        mayar_payment_id: payload.id,
        mayar_paid_at: payload.paidAt ?? now,
        updated_at: now,
      })
      .where(eq(topupTransactions.invoice_id, invoiceId));

    await mutatBalance({
      userId: trx.user_id,
      amount: trx.price,
      type: "TOPUP_IN",
      note: `Deposit via Mayar ${payload.id}`,
      topupTrxId: trx.id,
    });

    logger.info("[webhook:mayar] deposit credited", {
      userId: trx.user_id,
      invoiceId,
      amount: trx.price,
    });

    return NextResponse.json({ ok: true });
  }

  // ── Direct topup order: execute PortalPulsa ──────────────────────────────
  // Mark Mayar payment received, set PENDING, then call PP
  await db
    .update(topupTransactions)
    .set({
      status: "PENDING",
      mayar_payment_id: payload.id,
      mayar_paid_at: payload.paidAt ?? now,
      updated_at: now,
    })
    .where(eq(topupTransactions.invoice_id, invoiceId));

  logger.info("[webhook:mayar] direct order payment received, executing PP", { invoiceId });

  let ppRes;
  try {
    ppRes = await createOrder({
      invoiceId: trx.invoice_id,
      productCode: trx.product_code,
      targetNumber: trx.target_number,
    });
  } catch (ppError) {
    // PP unreachable — keep PENDING, cron will retry
    logger.error("[webhook:mayar] PP unreachable after payment", {
      invoiceId,
      error: String(ppError),
    });
    return NextResponse.json({ ok: true });
  }

  if (ppRes.status === "success") {
    await db
      .update(topupTransactions)
      .set({
        status: "SUCCESS",
        portalpulsa_trxid: ppRes.trxId ?? null,
        portalpulsa_sn: ppRes.sn ?? null,
        portalpulsa_rc: ppRes.rc,
        portalpulsa_message: ppRes.message,
        updated_at: now,
      })
      .where(eq(topupTransactions.invoice_id, invoiceId));

    logger.info("[webhook:mayar] direct order success", {
      invoiceId,
      ppTrxId: ppRes.trxId,
      sn: ppRes.sn,
    });
  } else if (ppRes.status === "pending") {
    await db
      .update(topupTransactions)
      .set({
        portalpulsa_trxid: ppRes.trxId ?? null,
        portalpulsa_rc: ppRes.rc,
        portalpulsa_message: ppRes.message,
        updated_at: now,
      })
      .where(eq(topupTransactions.invoice_id, invoiceId));

    logger.info("[webhook:mayar] direct order PP pending", { invoiceId });
  } else {
    // PP failed — mark FAILED (no saldo to refund for direct orders)
    await db
      .update(topupTransactions)
      .set({
        status: "FAILED",
        portalpulsa_rc: ppRes.rc,
        portalpulsa_message: ppRes.message,
        failure_reason: ppRes.message ?? `PP RC: ${ppRes.rc}`,
        updated_at: now,
      })
      .where(eq(topupTransactions.invoice_id, invoiceId));

    logger.warn("[webhook:mayar] direct order PP failed", {
      invoiceId,
      rc: ppRes.rc,
      message: ppRes.message,
    });
  }

  return NextResponse.json({ ok: true });
}
