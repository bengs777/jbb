import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, sellerEarnings, kurirEarnings, topupTransactions, gameOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { classifyEarnings } from "@/lib/utils";
import { mutatBalance } from "@/lib/balance";
import { createOrder } from "@/lib/portalpulsa";

const USE_MOCK = process.env.MAYAR_USE_MOCK === "true";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!USE_MOCK) {
    return NextResponse.json({ ok: false, error: "Sandbox tidak aktif" }, { status: 403 });
  }

  // ── Deposit / top-up saldo ──────────────────────────────────────────────────
  const [topupTrx] = await db
    .select()
    .from(topupTransactions)
    .where(eq(topupTransactions.invoice_id, orderId))
    .limit(1);

  if (topupTrx) {
    if (topupTrx.status === "SUCCESS") {
      return NextResponse.json({ ok: true, message: "Sudah dikreditkan" });
    }
    const now = new Date().toISOString();

    if (topupTrx.product_code === "__DEPOSIT__") {
      // Deposit: credit saldo user
      await mutatBalance({
        userId: topupTrx.user_id,
        amount: topupTrx.price,
        type: "TOPUP_IN",
        note: `Deposit sandbox: ${orderId}`,
        topupTrxId: topupTrx.id,
      });
      await db
        .update(topupTransactions)
        .set({ status: "SUCCESS", mayar_paid_at: now, updated_at: now })
        .where(eq(topupTransactions.id, topupTrx.id));
      console.log(`[sandbox] Deposit ${orderId} credited Rp${topupTrx.price} to user ${topupTrx.user_id}`);
      return NextResponse.json({ ok: true, message: "Deposit simulasi berhasil" });
    }

    // Direct topup order: simulate PortalPulsa execution (no saldo mutation)
    const ppRes = await createOrder({
      invoiceId: topupTrx.invoice_id,
      productCode: topupTrx.product_code,
      targetNumber: topupTrx.target_number,
    });
    const ppStatus =
      ppRes.status === "success" ? "SUCCESS" : ppRes.status === "pending" ? "PENDING" : "FAILED";
    await db
      .update(topupTransactions)
      .set({
        status: ppStatus,
        mayar_paid_at: now,
        portalpulsa_trxid: ppRes.trxId ?? null,
        portalpulsa_sn: ppRes.sn ?? null,
        portalpulsa_rc: ppRes.rc,
        portalpulsa_message: ppRes.message,
        updated_at: now,
      })
      .where(eq(topupTransactions.id, topupTrx.id));
    console.log(`[sandbox] Direct topup ${orderId} executed via PP mock, status=${ppStatus}`);
    return NextResponse.json({ ok: true, message: `Topup simulasi ${ppStatus.toLowerCase()}` });
  }

  // ── Game Voucher order ──────────────────────────────────────────────────────
  const [gameOrder] = await db
    .select()
    .from(gameOrders)
    .where(eq(gameOrders.invoice_id, orderId))
    .limit(1);

  if (gameOrder) {
    if (gameOrder.status === "PAID") {
      return NextResponse.json({ ok: true, message: "Sudah PAID" });
    }
    const now = new Date().toISOString();
    await db
      .update(gameOrders)
      .set({ status: "PAID", mayar_paid_at: now, updated_at: now })
      .where(eq(gameOrders.id, gameOrder.id));
    console.log(`[sandbox] Game order ${orderId} PAID — ${gameOrder.game_name} ${gameOrder.nominal_label} for ${gameOrder.target_user_id}`);
    return NextResponse.json({ ok: true, message: "Pembayaran game simulasi berhasil" });
  }

  // ── Regular marketplace order ───────────────────────────────────────────────
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order tidak ditemukan" }, { status: 404 });
  }

  if (order.status_pembayaran === "PAID") {
    return NextResponse.json({ ok: true, message: "Sudah PAID" });
  }

  // In mock/sandbox mode we allow paying even expired orders (for dev testing)

  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status_pembayaran: "PAID",
        status_pesanan: "MENUNGGU",
        // Reset expired_at to future so it's not blocked
        expired_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        updated_at: now,
      })
      .where(eq(orders.id, orderId));

    const sellerAmount = order.total_produk;
    await tx.insert(sellerEarnings).values({
      id: crypto.randomUUID(),
      seller_id: order.seller_id,
      order_id: orderId,
      jumlah: sellerAmount,
      tanggal: now,
      klasifikasi: classifyEarnings(sellerAmount),
    });

    if (order.kurir_id) {
      await tx.insert(kurirEarnings).values({
        id: crypto.randomUUID(),
        kurir_id: order.kurir_id,
        order_id: orderId,
        fee_kurir: order.fee_kurir,
        tanggal: now,
        klasifikasi: classifyEarnings(order.fee_kurir),
      });
    }
  });

  console.log(`[sandbox] Order ${orderId} manually marked PAID`);
  return NextResponse.json({ ok: true, message: "Pembayaran simulasi berhasil" });
}
