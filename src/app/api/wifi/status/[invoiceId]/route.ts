import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wifiOrders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;

  const [order] = await db
    .select({
      status: wifiOrders.status,
      packet_name: wifiOrders.packet_name,
      duration: wifiOrders.duration,
      voucher_username: wifiOrders.voucher_username,
      voucher_password: wifiOrders.voucher_password,
      amount: wifiOrders.amount,
    })
    .from(wifiOrders)
    .where(eq(wifiOrders.invoice_id, invoiceId))
    .limit(1);

  if (!order) {
    return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: order });
}