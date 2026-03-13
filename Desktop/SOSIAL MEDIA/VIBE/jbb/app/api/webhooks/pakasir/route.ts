import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { orders, notifications } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

async function createNotification(userId: string, message: string, type: string) {
  await db.insert(notifications).values({
    id: nanoid(),
    userId,
    message,
    type,
    isRead: false,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status, project, completed_at } = body;
    
    // In production, verify PAKASIR_PROJECT_SLUG
    if (process.env.PAKASIR_PROJECT_SLUG && project !== process.env.PAKASIR_PROJECT_SLUG) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }
    
    if (status === "completed") {
      const order = await db.query.orders.findFirst({
        where: eq(orders.externalId, order_id),
      });

      if (order && order.status === "pending") {
        await db.update(orders)
          .set({ 
            status: "paid", 
            paidAt: completed_at ? new Date(completed_at) : new Date() 
          })
          .where(eq(orders.externalId, order_id));

        // Notifications
        // 1. Notify Seller
        await createNotification(
          order.sellerId, 
          `Pesanan baru ${order_id} telah dibayar! Silakan proses pesanan.`, 
          "order_paid"
        );
        // 2. Notify Buyer
        await createNotification(
          order.buyerId, 
          `Pembayaran pesanan ${order_id} berhasil. Penjual akan segera memproses.`, 
          "payment_success"
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Pakasir Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
