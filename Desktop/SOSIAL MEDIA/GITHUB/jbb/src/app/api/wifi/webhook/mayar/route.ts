import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wifiOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateHotspotVoucher } from "@/lib/mikrotik";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderId, status, amount } = body;

  if (!orderId || status !== "PAID") {
    return NextResponse.json({ success: true }); // Ignore non-paid
  }

  const [order] = await db
    .select()
    .from(wifiOrders)
    .where(eq(wifiOrders.invoice_id, orderId))
    .limit(1);

  if (!order || order.status !== "WAITING_PAYMENT") {
    return NextResponse.json({ success: true });
  }

  // Generate voucher from MikroTik
  try {
    const voucher = await generateHotspotVoucher(order.packet_id, `JBB-${order.invoice_id}`);

    await db
      .update(wifiOrders)
      .set({
        status: "PAID",
        mayar_paid_at: new Date().toISOString(),
        voucher_username: voucher.username,
        voucher_password: voucher.password,
      })
      .where(eq(wifiOrders.id, order.id));

    logger.info(`[wifi/webhook] Voucher generated for ${orderId}: ${voucher.username}`);
  } catch (error) {
    logger.error(`[wifi/webhook] Failed to generate voucher for ${orderId}`, { error: String(error) });
    await db
      .update(wifiOrders)
      .set({ status: "FAILED" })
      .where(eq(wifiOrders.id, order.id));
  }

  return NextResponse.json({ success: true });
}