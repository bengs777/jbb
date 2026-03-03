/**
 * POST /api/topup/order
 *
 * Flow:
 * 1. Validasi input & rate limit
 * 2. Load produk dari cache DB
 * 3. Cek saldo mencukupi
 * 4. Hold saldo (debit ke hold) — atomic ledger entry
 * 5. Insert topup_transaction (PENDING)
 * 6. Kirim order ke PortalPulsa
 * 7. Update status berdasarkan response PP
 *    - success → debit hold, kredit profit admin
 *    - pending → biarkan (cron / webhook akan resolve)
 *    - failed  → kembalikan hold (REFUND)
 *
 * Body: { productCode: string, targetNumber: string }
 */

import { NextRequest } from "next/server";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { db } from "@/db";
import { topupProducts, topupTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createOrder, calculateProfit } from "@/lib/portalpulsa";
import { mutatBalance, getBalance } from "@/lib/balance";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getExpiredAt } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ("status" in auth) return auth;
  const { user } = auth;

  // Anti double-click: 3 order per 30 detik per user
  const rl = rateLimit(`${user.id}:topup:order`, 3, 30_000);
  if (!rl.ok) {
    return err("Terlalu cepat, tunggu sebentar sebelum order berikutnya", 429);
  }

  let body: { productCode?: string; targetNumber?: string };
  try {
    body = await req.json();
  } catch {
    return err("Body tidak valid");
  }

  const { productCode, targetNumber } = body;
  if (!productCode || !targetNumber) {
    return err("productCode dan targetNumber wajib diisi");
  }
  if (!/^[0-9]{8,20}$/.test(targetNumber.replace(/\s/g, ""))) {
    return err("Nomor tujuan tidak valid (8-20 digit angka)");
  }

  // 1. Load produk dari cache
  const [product] = await db
    .select()
    .from(topupProducts)
    .where(eq(topupProducts.code, productCode))
    .limit(1);

  if (!product) return err("Produk tidak ditemukan", 404);
  if (product.status !== "available") return err("Produk sedang tidak tersedia");

  const price = product.price;  // harga jual (sudah +5%)
  const cost = product.cost;
  const profit = calculateProfit(price, cost);

  // 2. Cek saldo
  const { balance } = await getBalance(user.id);
  if (balance < price) {
    return err(
      `Saldo tidak cukup. Saldo Anda: Rp ${balance.toLocaleString("id-ID")}, dibutuhkan: Rp ${price.toLocaleString("id-ID")}`
    );
  }

  // 3. Idempotency key
  const invoiceId = `PP-${user.id.slice(0, 8)}-${Date.now()}`;

  try {
    // 4. Hold saldo (atomic)
    await mutatBalance({
      userId: user.id,
      amount: -price,   // negatif = keluar dari balance, masuk ke hold
      type: "ORDER_HOLD",
      note: `Hold order ${invoiceId}`,
    });

    // 5. Insert transaksi (PENDING)
    await db.insert(topupTransactions).values({
      user_id: user.id,
      invoice_id: invoiceId,
      product_code: productCode,
      target_number: targetNumber.replace(/\s/g, ""),
      price,
      cost,
      profit,
      status: "PENDING",
      expired_at: getExpiredAt(30), // 30 menit window
    });

    logger.info("[topup:order] created", {
      userId: user.id,
      invoiceId,
      productCode,
      price,
    });

    // 6. Kirim ke PortalPulsa
    let ppRes;
    try {
      ppRes = await createOrder({
        invoiceId,
        productCode,
        targetNumber: targetNumber.replace(/\s/g, ""),
      });
    } catch (ppError) {
      // PP tidak bisa dihubungi — refund hold, flag transaksi
      await refundAndFail(invoiceId, user.id, price, String(ppError));
      logger.error("[topup:order] PP unreachable", {
        userId: user.id,
        invoiceId,
        error: String(ppError),
      });
      return err("Sistem top-up sedang gangguan, saldo Anda telah dikembalikan", 503);
    }

    // 7. Handle PP response
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

      // Debit hold → final debit
      await mutatBalance({
        userId: user.id,
        amount: -price,  // sudah hold, sekarang resmi debit
        type: "ORDER_DEBIT",
        note: `Debit sukses order ${invoiceId}`,
      });

      logger.info("[topup:order] success", { invoiceId, ppTrxId: ppRes.trxId });

      return ok({
        invoiceId,
        status: "SUCCESS",
        sn: ppRes.sn,
        message: ppRes.message,
      });
    }

    if (ppRes.status === "pending") {
      // Tandai transaksi sebagai PENDING — webhook/cron akan resolve
      await db
        .update(topupTransactions)
        .set({
          portalpulsa_trxid: ppRes.trxId ?? null,
          portalpulsa_rc: ppRes.rc,
          portalpulsa_message: ppRes.message,
          updated_at: new Date().toISOString(),
        })
        .where(eq(topupTransactions.invoice_id, invoiceId));

      return ok({
        invoiceId,
        status: "PENDING",
        message: "Transaksi sedang diproses oleh operator, harap tunggu",
      });
    }

    // Failed
    await refundAndFail(invoiceId, user.id, price, ppRes.message);
    return err(`Transaksi gagal: ${ppRes.message}`);

  } catch (e) {
    logger.error("[topup:order] unexpected error", {
      userId: user.id,
      invoiceId,
      error: String(e),
    });
    // Best-effort refund
    try {
      await refundAndFail(invoiceId, user.id, price, String(e));
    } catch (_) {}
    return err("Terjadi kesalahan sistem", 500);
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function refundAndFail(
  invoiceId: string,
  userId: string,
  price: number,
  reason: string
) {
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
    amount: price,   // positif = kembalikan ke saldo
    type: "REFUND",
    note: `Refund order gagal ${invoiceId}`,
  });

  logger.info("[topup:order] refunded", { invoiceId, userId, price });
}
