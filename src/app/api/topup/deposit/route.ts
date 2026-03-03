/**
 * POST /api/topup/deposit
 * User membeli saldo dompet JBB melalui Mayar.id.
 * Setelah Mayar mengirim webhook paid → balance di-credit via /api/topup/deposit/webhook.
 *
 * Body: { amount: number }  — min 10.000
 */

import { NextRequest } from "next/server";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { createMayarPayment } from "@/lib/mayar";
import { db } from "@/db";
import { topupTransactions } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const MIN_DEPOSIT = 10_000;
const MAX_DEPOSIT = 10_000_000;

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("status" in auth) return auth;
  const { user } = auth;

  // Rate limit: 5 deposits per 10 menit
  const rl = rateLimit(`${user.id}:deposit`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return err("Terlalu banyak permintaan, coba lagi nanti", 429);
  }

  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return err("Body tidak valid");
  }

  const amount = Number(body.amount);
  if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
    return err(`Nominal deposit harus antara ${MIN_DEPOSIT} dan ${MAX_DEPOSIT}`);
  }

  const invoiceId = `DEP-${user.id.slice(0, 8)}-${Date.now()}`;

  try {
    // 1. Buat payment Mayar
    const paymentResult = await createMayarPayment({
      orderId: invoiceId,
      amount,
      description: `Deposit saldo JBB — ${invoiceId}`,
      customerEmail: user.email,
    });

    // 2. Simpan transaksi deposit (status WAITING_PAYMENT)
    await db.insert(topupTransactions).values({
      user_id: user.id,
      invoice_id: invoiceId,
      product_code: "__DEPOSIT__",
      target_number: user.email,
      price: amount,
      cost: amount,          // deposit tidak ada markup/modal
      profit: 0,
      mayar_payment_id: paymentResult.paymentId,
      mayar_payment_url: paymentResult.paymentUrl,
      status: "WAITING_PAYMENT",
      expired_at: paymentResult.expiredAt,
    });

    logger.info("[deposit] created", { userId: user.id, invoiceId, amount });

    return ok({
      invoiceId,
      paymentUrl: paymentResult.paymentUrl,
      expiredAt: paymentResult.expiredAt,
      amount,
    });
  } catch (e) {
    logger.error("[deposit] failed", { userId: user.id, error: String(e) });
    return err("Gagal membuat link pembayaran", 500);
  }
}
