/**
 * GET /api/games/status/[invoiceId]
 * Polling endpoint for game order status.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameOrders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;

  const [order] = await db
    .select()
    .from(gameOrders)
    .where(eq(gameOrders.invoice_id, invoiceId))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: order });
}
