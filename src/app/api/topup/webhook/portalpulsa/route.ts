/**
 * POST /api/topup/webhook/portalpulsa
 *
 * PortalPulsa callback setelah transaksi selesai/gagal di sisi operator.
 * Idempotent: jika sudah SUCCESS/FAILED/REFUNDED → return 200 tanpa proses.
 *
 * Security: Validasi HMAC signature dari PP.
 * PP biasanya kirim: trx_id, invoice_id, rc, sn, sign
 * sign = MD5(member_id + api_key + trx_id)
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db";
import { topupTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mutatBalance } from "@/lib/balance";
import { logger } from "@/lib/logger";

const MEMBER_ID = (process.env.PORTALPULSA_MEMBER_ID ?? "").trim();
const API_KEY = (process.env.PORTALPULSA_API_KEY ?? "").trim();

function verifyPPSignature(trxId: string, sign: string): boolean {
  if (!MEMBER_ID || !API_KEY) return true; // dev mode
  const expected = createHash("md5")
    .update(MEMBER_ID + API_KEY + trxId)
    .digest("hex");
  return expected === sign;
}

interface PPWebhookPayload {
  trx_id?: string;
  invoice_id?: string;
  rc?: string;
  sn?: string;
  message?: string;
  sign?: string;
}

export async function POST(req: NextRequest) {
  let payload: PPWebhookPayload;
  try {
    // PP bisa kirim form-data atau JSON
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries()) as PPWebhookPayload;
    } else {
      payload = await req.json();
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { trx_id, invoice_id, rc, sn, message, sign } = payload;

  logger.info("[webhook:pp] received", { trx_id, invoice_id, rc });

  if (!trx_id || !sign) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 1. Verify signature
  if (!verifyPPSignature(trx_id, sign)) {
    logger.warn("[webhook:pp] invalid signature", { trx_id });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Temukan transaksi — cari by invoice_id (fallback trx_id)
  let trx;
  if (invoice_id) {
    [trx] = await db
      .select()
      .from(topupTransactions)
      .where(eq(topupTransactions.invoice_id, invoice_id))
      .limit(1);
  }
  if (!trx && trx_id) {
    [trx] = await db
      .select()
      .from(topupTransactions)
      .where(eq(topupTransactions.portalpulsa_trxid, trx_id))
      .limit(1);
  }

  if (!trx) {
    logger.warn("[webhook:pp] transaction not found", { trx_id, invoice_id });
    return NextResponse.json({ ok: true }); // acknowledge to prevent PP retry loop
  }

  // 3. Idempotency — hanya proses jika masih PENDING
  if (trx.status !== "PENDING") {
    logger.info("[webhook:pp] already resolved", {
      invoiceId: trx.invoice_id,
      status: trx.status,
    });
    return NextResponse.json({ ok: true });
  }

  const isSuccess = rc === "00";
  const isFailed = rc !== "00" && rc !== "06"; // 06 = masih pending

  if (isSuccess) {
    // 4a. Tandai sukses
    await db
      .update(topupTransactions)
      .set({
        status: "SUCCESS",
        portalpulsa_trxid: trx_id,
        portalpulsa_sn: sn ?? null,
        portalpulsa_rc: rc,
        portalpulsa_message: message ?? null,
        updated_at: new Date().toISOString(),
      })
      .where(eq(topupTransactions.id, trx.id));

    // Debit hold → final (hold sudah dipotong saat order, sekarang konfirmasi saja)
    await mutatBalance({
      userId: trx.user_id,
      amount: -trx.price,
      type: "ORDER_DEBIT",
      note: `Konfirmasi debit ${trx.invoice_id}`,
      topupTrxId: trx.id,
    });

    logger.info("[webhook:pp] success", {
      invoiceId: trx.invoice_id,
      trxId: trx_id,
      sn,
    });
  } else if (isFailed) {
    // 4b. Gagal → refund hold
    await db
      .update(topupTransactions)
      .set({
        status: "FAILED",
        portalpulsa_trxid: trx_id ?? null,
        portalpulsa_rc: rc ?? null,
        portalpulsa_message: message ?? null,
        failure_reason: message ?? `RC: ${rc}`,
        updated_at: new Date().toISOString(),
      })
      .where(eq(topupTransactions.id, trx.id));

    await mutatBalance({
      userId: trx.user_id,
      amount: trx.price,
      type: "REFUND",
      note: `Refund gagal ${trx.invoice_id} (RC: ${rc})`,
      topupTrxId: trx.id,
    });

    logger.info("[webhook:pp] failed+refunded", {
      invoiceId: trx.invoice_id,
      rc,
    });
  }
  // rc === "06" → masih pending, tidak ada action

  return NextResponse.json({ ok: true });
}
