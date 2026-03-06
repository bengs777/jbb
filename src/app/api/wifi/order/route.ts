import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wifiOrders } from "@/db/schema";
import { getUserFromRequest } from "@/lib/api-helpers";
import { createMayarPayment } from "@/lib/mayar";
import { addHotspotUser } from "@/lib/mikrotik";
import { logger } from "@/lib/logger";

const PRODUCT_PROVIDER = "MIKROTIK";

export async function POST(req: NextRequest) {
  let body: {
    packetId: string;
    packetName: string;
    price: number;
    duration: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Body tidak valid" }, { status: 400 });
  }

  const { packetId, packetName, price, duration } = body;

  if (!packetId || !packetName || !price || !duration) {
    return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400 });
  }
  if (price <= 0) {
    return NextResponse.json({ success: false, error: "Harga tidak valid" }, { status: 400 });
  }

  const user = getUserFromRequest(req);
  const invoiceId = `WIFI-${packetId.toUpperCase()}-${Date.now()}`;
  const expiredAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();
  const now = new Date().toISOString();

  // Create Mayar payment
  const payment = await createMayarPayment({
    orderId: invoiceId,
    amount: price,
    description: `Voucher Wifi ${packetName} — ${duration}`,
    customerName: "Pelanggan JBB",
    customerEmail: user?.email ?? "pelanggan@jbb.com",
    redirectUrl: `${appUrl}/wifi/status/${invoiceId}`,
  });

  if (!payment.success) {
    return NextResponse.json({ success: false, error: "Gagal membuat link pembayaran" }, { status: 500 });
  }

  // Save order
  await db.insert(wifiOrders).values({
    user_id: user?.id ?? null,
    packet_id: packetId,
    packet_name: packetName,
    duration,
    amount: price,
    invoice_id: invoiceId,
    mayar_payment_id: payment.paymentId,
    mayar_payment_url: payment.paymentUrl,
    status: "WAITING_PAYMENT",
    expired_at: expiredAt,
  });

  console.log(`[wifi/order] created ${invoiceId} — ${packetName} ${duration} Rp${price}`);

  return NextResponse.json({
    success: true,
    data: { invoiceId, paymentUrl: payment.paymentUrl, expiredAt: payment.expiredAt },
  });
}