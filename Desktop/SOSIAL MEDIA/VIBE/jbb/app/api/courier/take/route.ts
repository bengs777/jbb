import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { orders, notifications } from "@/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

// POST /api/courier/take - Take an order to deliver
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

    // Check if order is still available
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.status, "processed"),
        isNull(orders.courierId)
      ),
    });

    if (!order) {
      return NextResponse.json({ error: "Order no longer available" }, { status: 404 });
    }

    // Update order
    await db.update(orders)
      .set({
        courierId: session.user.id,
        status: "shipping",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Notify Buyer
    await db.insert(notifications).values({
      id: nanoid(),
      userId: order.buyerId,
      type: "order_shipping",
      message: `Pesanan Anda sedang dalam pengiriman oleh kurir ${session.user.name}.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API_COURIER_TAKE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
