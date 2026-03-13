import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { orders, notifications } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

// GET /api/courier/my-deliveries - List active deliveries for courier
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "courier") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myDeliveries = await db.query.orders.findMany({
      where: and(
        eq(orders.courierId, session.user.id),
        eq(orders.status, "shipping")
      ),
      with: {
        buyer: true,
        seller: true,
        items: {
          with: {
            product: true
          }
        }
      },
      orderBy: (orders, { desc }) => [desc(orders.updatedAt)],
    });

    return NextResponse.json(myDeliveries);
  } catch (error) {
    console.error("[API_COURIER_MY_DELIVERIES]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/courier/complete - Mark delivery as completed
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "courier") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.courierId, session.user.id),
        eq(orders.status, "shipping")
      ),
    });

    if (!order) {
      return NextResponse.json({ error: "Delivery not found or not in shipping status" }, { status: 404 });
    }

    // Update order
    await db.update(orders)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Notify Buyer
    await db.insert(notifications).values({
      id: nanoid(),
      userId: order.buyerId,
      type: "order_completed",
      message: `Pesanan Anda telah sampai di tujuan. Terima kasih telah berbelanja!`,
    });

    // Notify Seller
    await db.insert(notifications).values({
      id: nanoid(),
      userId: order.sellerId,
      type: "order_completed",
      message: `Pesanan #${order.externalId} telah diterima oleh pembeli.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API_COURIER_COMPLETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
