/**
 * POST /api/games/order
 *
 * Buat order top-up game.
 * payWithBalance=true  → potong saldo user langsung (harus login)
 * payWithBalance=false → buat Mayar payment link (guest/login)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { digitalProducts, gameOrders } from "@/db/schema";
import { getUserFromRequest, requireAuth } from "@/lib/api-helpers";
import { createMayarPayment } from "@/lib/mayar";
import { getBalance, mutatBalanceInTransaction } from "@/lib/balance";
import { validateProductPrice } from "@/lib/apigames";
import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

const PRODUCT_PROVIDER = "APIGAMES";

export async function POST(req: NextRequest) {
  let body: {
    gameId: string;
    gameName: string;
    nominalLabel: string;
    nominalValue: string;
    price: number;
    productCode: string;
    targetUserId: string;
    targetServerId?: string;
    customerName?: string;
    customerEmail?: string;
    payWithBalance?: boolean;
    idempotencyKey?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Body tidak valid" }, { status: 400 });
  }

  const {
    gameId,
    gameName,
    nominalLabel,
    nominalValue,
    price,
    productCode,
    targetUserId,
    targetServerId,
    customerName,
    customerEmail,
    payWithBalance,
    idempotencyKey: idempotencyKeyBody,
  } = body;

  if (!gameId || !gameName || !nominalLabel || !price || !targetUserId || !productCode) {
    return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400 });
  }
  if (price <= 0) {
    return NextResponse.json({ success: false, error: "Harga tidak valid" }, { status: 400 });
  }

  const idempotencyKey =
    req.headers.get("x-idempotency-key")?.trim() ||
    idempotencyKeyBody?.trim() ||
    null;

  if (idempotencyKey) {
    const [existing] = await db
      .select({
        invoice_id: gameOrders.invoice_id,
        status: gameOrders.status,
        mayar_payment_url: gameOrders.mayar_payment_url,
        expired_at: gameOrders.expired_at,
      })
      .from(gameOrders)
      .where(eq(gameOrders.idempotency_key, idempotencyKey))
      .limit(1);

    if (existing) {
      return NextResponse.json({
        success: true,
        data: {
          invoiceId: existing.invoice_id,
          paid: existing.status === "PAID",
          paymentUrl: existing.status === "WAITING_PAYMENT" ? existing.mayar_payment_url : null,
          expiredAt: existing.expired_at,
          idempotent: true,
        },
      });
    }
  }

  const [catalogProduct] = await db
    .select()
    .from(digitalProducts)
    .where(
      and(
        eq(digitalProducts.code, productCode),
        eq(digitalProducts.provider, PRODUCT_PROVIDER),
        eq(digitalProducts.status, "ACTIVE")
      )
    )
    .limit(1);

  if (!catalogProduct) {
    return NextResponse.json({ success: false, error: "Produk tidak ditemukan / tidak aktif" }, { status: 404 });
  }

  if (catalogProduct.sell_price !== price) {
    return NextResponse.json({
      success: false,
      error: `Harga berubah. Harga terbaru: Rp ${catalogProduct.sell_price.toLocaleString("id-ID")}`,
    }, { status: 409 });
  }

  let providerLive;
  try {
    providerLive = await validateProductPrice(productCode);
  } catch (error) {
    logger.error("[games/order] apigames validation failed", {
      productCode,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: "Gagal validasi harga provider" }, { status: 502 });
  }

  if (catalogProduct.buy_price < providerLive.buyPrice) {
    return NextResponse.json({
      success: false,
      error: "Harga provider naik. Silakan sinkronkan produk dulu.",
      data: {
        providerBuyPrice: providerLive.buyPrice,
        localBuyPrice: catalogProduct.buy_price,
      },
    }, { status: 409 });
  }

  const invoiceId = `GAME-${gameId.toUpperCase()}-${Date.now()}`;
  const expiredAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();
  const now = new Date().toISOString();

  // ── Bayar dengan Saldo ────────────────────────────────────────────────────
  if (payWithBalance) {
    const guard = requireAuth(req);
    if ("status" in guard) {
      return NextResponse.json({ success: false, error: "Harus login untuk bayar dengan saldo" }, { status: 401 });
    }
    const user = guard.user;

    const { balance } = await getBalance(user.id);
    if (balance < price) {
      return NextResponse.json({
        success: false,
        error: `Saldo tidak cukup. Saldo Anda: Rp ${balance.toLocaleString("id-ID")}, dibutuhkan: Rp ${price.toLocaleString("id-ID")}`,
      }, { status: 400 });
    }

    try {
      await db.transaction(async (tx) => {
        await mutatBalanceInTransaction(tx, {
          userId: user.id,
          amount: -price,
          type: "ORDER_HOLD",
          note: `Game topup ${gameName} — ${nominalLabel} (${targetUserId}${targetServerId ? `/${targetServerId}` : ""})`,
        });

        await tx.insert(gameOrders).values({
          user_id: user.id,
          game_id: gameId,
          game_name: gameName,
          nominal_label: nominalLabel,
          nominal_value: nominalValue,
          target_user_id: targetUserId,
          target_server_id: targetServerId ?? null,
          amount: price,
          idempotency_key: idempotencyKey,
          provider: PRODUCT_PROVIDER,
          provider_product_code: productCode,
          provider_buy_price: providerLive.buyPrice,
          provider_sell_price: catalogProduct.sell_price,
          invoice_id: invoiceId,
          mayar_payment_id: null,
          mayar_payment_url: null,
          status: "PAID",
          mayar_paid_at: now,
          expired_at: expiredAt,
        });
      });

      console.log(`[games/order] SALDO PAID ${invoiceId} — ${gameName} ${nominalLabel} Rp${price} user:${user.id}`);

      return NextResponse.json({
        success: true,
        data: { invoiceId, paid: true, paymentUrl: null },
      });
    } catch (e: any) {
      console.error("[games/order] saldo error", e);
      return NextResponse.json({ success: false, error: e.message ?? "Gagal memproses pembayaran saldo" }, { status: 500 });
    }
  }

  // ── Bayar via Mayar ───────────────────────────────────────────────────────
  const user = getUserFromRequest(req);

  let payment: { paymentId: string; paymentUrl: string; expiredAt: string };
  try {
    const result = await createMayarPayment({
      orderId: invoiceId,
      amount: price,
      description: `Top-up ${gameName} — ${nominalLabel} (ID: ${targetUserId}${targetServerId ? `/${targetServerId}` : ""})`,
      customerName: customerName ?? "Pelanggan JBB",
      customerEmail: customerEmail ?? "pelanggan@jbb.com",
      redirectUrl: `${appUrl}/games/status/${invoiceId}`,
    });
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Gagal membuat link pembayaran" }, { status: 500 });
    }
    payment = { paymentId: result.paymentId, paymentUrl: result.paymentUrl, expiredAt: result.expiredAt };
  } catch (e) {
    console.error("[games/order] mayar error", e);
    return NextResponse.json({ success: false, error: "Gagal menghubungi payment gateway" }, { status: 500 });
  }

  try {
    await db.insert(gameOrders).values({
      user_id: user?.id ?? null,
      game_id: gameId,
      game_name: gameName,
      nominal_label: nominalLabel,
      nominal_value: nominalValue,
      target_user_id: targetUserId,
      target_server_id: targetServerId ?? null,
      amount: price,
      idempotency_key: idempotencyKey,
      provider: PRODUCT_PROVIDER,
      provider_product_code: productCode,
      provider_buy_price: providerLive.buyPrice,
      provider_sell_price: catalogProduct.sell_price,
      invoice_id: invoiceId,
      mayar_payment_id: payment.paymentId,
      mayar_payment_url: payment.paymentUrl,
      status: "WAITING_PAYMENT",
      expired_at: expiredAt,
    });
  } catch (e) {
    console.error("[games/order] db error", e);
    return NextResponse.json({ success: false, error: "Gagal menyimpan order" }, { status: 500 });
  }

  console.log(`[games/order] created ${invoiceId} — ${gameName} ${nominalLabel} Rp${price}`);

  return NextResponse.json({
    success: true,
    data: { invoiceId, paymentUrl: payment.paymentUrl, expiredAt: payment.expiredAt },
  });
}
