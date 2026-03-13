/**
 * POST /api/topup/order
 *
 * Two payment modes:
 *
 * payWithBalance=true  (wallet mode)
 *   → hold saldo → insert PENDING → call PortalPulsa → update status
 *
 * payWithBalance=false (direct mode, default)
 *   → insert WAITING_PAYMENT with Mayar invoice → return paymentUrl
 *   → Mayar webhook later calls PP and updates status
 *
 * Body: { productCode, targetNumber, payWithBalance? }
 */

import { NextRequest } from "next/server";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { db } from "@/db";
import { topupProducts, topupTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createOrder, calculateProfit } from "@/lib/portalpulsa";
import { mutatBalanceInTransaction, mutatBalance, getBalance } from "@/lib/balance";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getExpiredAt } from "@/lib/utils";
import { createMayarPayment } from "@/lib/mayar";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("status" in auth) return auth;
  const { user } = auth;

  // Anti double-click: 3 order per 30 detik per user
  const rl = rateLimit(`${user.id}:topup:order`, 3, 30_000);
  if (!rl.ok) {
    logger.error("[topup:order] Rate limit", { userId: user.id });
    return err("Terlalu cepat, tunggu sebentar sebelum order berikutnya", 429);
  }

  let body: { productCode?: string; targetNumber?: string; payWithBalance?: boolean };
  try {
    body = await req.json();
  } catch (e) {
    logger.error("[topup:order] Invalid body", { error: String(e) });
    return err("Body tidak valid");
  }

  const { productCode, targetNumber, payWithBalance = false } = body;
  if (!productCode || !targetNumber) {
    logger.error("[topup:order] Missing productCode/targetNumber", { body });
    return err("productCode dan targetNumber wajib diisi");
  }
  if (!/^[0-9]{8,20}$/.test(targetNumber.replace(/\s/g, ""))) {
    logger.error("[topup:order] Invalid targetNumber", { targetNumber });
    return err("Nomor tujuan tidak valid (8-20 digit angka)");
  }

  // 1. Load produk dari cache
  const [product] = await db
    .select()
    .from(topupProducts)
    .where(eq(topupProducts.code, productCode))
    .limit(1);

  if (!product) {
    logger.error("[topup:order] Produk tidak ditemukan", { productCode });
    return err("Produk tidak ditemukan", 404);
  }
  if (product.status !== "available") {
    logger.error("[topup:order] Produk tidak tersedia", { productCode });
    return err("Produk sedang tidak tersedia");
  }

  const price = product.price;
  const cost  = product.cost;
  const profit = calculateProfit(price, cost);
  const invoiceId = `PP-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const cleanTarget = targetNumber.replace(/\s/g, "");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();

  // ── Mode 1: Bayar dengan Saldo ────────────────────────────────────────────
  if (payWithBalance) {
    const { balance } = await getBalance(user.id);
    if (balance < price) {
      logger.error("[topup:order] Saldo tidak cukup", { userId: user.id, balance, price });
      return err(
        `Saldo tidak cukup. Saldo Anda: Rp ${balance.toLocaleString("id-ID")}, dibutuhkan: Rp ${price.toLocaleString("id-ID")}`
      );
    }

    try {
      // Atomic: hold saldo + insert transaksi dalam satu DB transaction
      await db.transaction(async (tx) => {
        await mutatBalanceInTransaction(tx, {
          userId: user.id,
          amount: -price,
          type: "ORDER_HOLD",
          note: `Hold order ${invoiceId}`,
        });

        await tx.insert(topupTransactions).values({
          user_id: user.id,
          invoice_id: invoiceId,
          product_code: productCode,
          target_number: cleanTarget,
          price, cost, profit,
          status: "PENDING",
          expired_at: getExpiredAt(30),
        });
      });

      logger.info("[topup:order] wallet order created", { userId: user.id, invoiceId, price });

      // Kirim ke PortalPulsa
      let ppRes;
      try {
        ppRes = await createOrder({ invoiceId, productCode, targetNumber: cleanTarget });
      } catch (ppError) {
        await refundAndFail(invoiceId, user.id, price, String(ppError));
        logger.error("[topup:order] PP unreachable", { userId: user.id, invoiceId, error: String(ppError) });
        return err("Sistem top-up sedang gangguan, saldo Anda telah dikembalikan", 503);
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
            updated_at: new Date().toISOString(),
          })
          .where(eq(topupTransactions.invoice_id, invoiceId));

        await mutatBalance({
          userId: user.id,
          amount: -price,
          type: "ORDER_DEBIT",
          note: `Debit sukses order ${invoiceId}`,
        });

        logger.info("[topup:order] wallet success", { invoiceId, ppTrxId: ppRes.trxId });
        return ok({ invoiceId, status: "SUCCESS", sn: ppRes.sn, message: ppRes.message });
      }

      if (ppRes.status === "pending") {
        await db
          .update(topupTransactions)
          .set({
            portalpulsa_trxid: ppRes.trxId ?? null,
            portalpulsa_rc: ppRes.rc,
            portalpulsa_message: ppRes.message,
            updated_at: new Date().toISOString(),
          })
          .where(eq(topupTransactions.invoice_id, invoiceId));

        return ok({ invoiceId, status: "PENDING", message: "Transaksi sedang diproses oleh operator, harap tunggu" });
      }

      // PP failed immediately
      await refundAndFail(invoiceId, user.id, price, ppRes.message);
      logger.error("[topup:order] PP failed", { invoiceId, ppRes });
      return err(`Transaksi gagal: ${ppRes.message}`);

    } catch (e) {
      logger.error("[topup:order] wallet unexpected error", { userId: user.id, invoiceId, error: String(e) });
      try { await refundAndFail(invoiceId, user.id, price, String(e)); } catch {}
      logger.error("[topup:order] Wallet mode unexpected error", { invoiceId, error: String(e) });
      return err("Terjadi kesalahan sistem", 500);
    }
  }

  // ── Mode 2: Bayar Langsung via Mayar ─────────────────────────────────────
  try {
    const paymentResult = await createMayarPayment({
      orderId: invoiceId,
      amount: price,
      description: `Top-up ${product.name} → ${cleanTarget}`,
      customerEmail: user.email,
      redirectUrl: `${appUrl}/topup/order/${invoiceId}`,
    });

    await db.insert(topupTransactions).values({
      user_id: user.id,
      invoice_id: invoiceId,
      product_code: productCode,
      target_number: cleanTarget,
      price, cost, profit,
      mayar_payment_id: paymentResult.paymentId,
      mayar_payment_url: paymentResult.paymentUrl,
      status: "WAITING_PAYMENT",
      expired_at: paymentResult.expiredAt,
    });

    logger.info("[topup:order] direct payment created", { userId: user.id, invoiceId, price });

    return ok({
      invoiceId,
      paymentUrl: paymentResult.paymentUrl,
      expiredAt: paymentResult.expiredAt,
    });
  } catch (e) {
    logger.error("[topup:order] mayar error", { userId: user.id, error: String(e) });
    logger.error("[topup:order] Mayar error", { userId: user.id, error: String(e) });
    return err("Gagal membuat link pembayaran", 500);
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function refundAndFail(invoiceId: string, userId: string, price: number, reason: string) {
  await db
    .update(topupTransactions)
    .set({
      status: "FAILED",
      failure_reason: reason.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .where(eq(topupTransactions.invoice_id, invoiceId));

  await mutatBalance({
    userId,
    amount: price,
    type: "REFUND",
    note: `Refund order gagal ${invoiceId}`,
  });

  logger.info("[topup:order] refunded", { invoiceId, userId, price });
}
