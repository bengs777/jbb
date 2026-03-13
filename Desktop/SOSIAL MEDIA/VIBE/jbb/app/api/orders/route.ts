import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { orders, orderItems, products, cartItems } from "@/server/db/schema";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { getPakasirConfig, PAKASIR_API_BASE } from "@/lib/pakasir-client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { items, paymentMethod } = body; // items: [{ productId, quantity }]

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // Calculate total and group by seller (Simplified: 1 order per checkout for this MVP)
    // In a real Shopee clone, it might split by seller. Here we keep it simple: 
    // We assume all items come from the same seller for simplicity or just pick the first seller.
    const productData = await Promise.all(
      items.map(async (item: any) => {
        const p = await db.query.products.findFirst({ where: eq(products.id, item.productId) });
        return { ...p, quantity: item.quantity };
      })
    );

    const sellerId = productData[0].sellerId;
    const totalAmount = productData.reduce((acc, curr) => acc + (curr.price! * curr.quantity), 0);
    const orderId = nanoid();
    const externalId = `UMKM-${orderId}`;

    // Create Pakasir Transaction
    const { project, apiKey } = getPakasirConfig();
    let pakasirData = null;

    if (project && apiKey) {
      try {
        const pResponse = await fetch(`${PAKASIR_API_BASE}/transactioncreate/${paymentMethod || 'qris'}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project,
            order_id: externalId,
            amount: totalAmount,
            api_key: apiKey,
          }),
        });
        
        if (pResponse.ok) {
          const pResult = await pResponse.json();
          pakasirData = pResult.payment;
        }
      } catch (e) {
        console.error("Pakasir API Error:", e);
      }
    }

    // Insert Order
    const [newOrder] = await db.insert(orders).values({
      id: orderId,
      externalId,
      buyerId: session.user.id,
      sellerId,
      totalAmount,
      status: "pending",
      paymentNumber: pakasirData?.payment_number,
      paymentMethod: pakasirData?.payment_method || paymentMethod,
      totalPayment: pakasirData?.total_payment || totalAmount,
      paymentFee: pakasirData?.fee || 0,
      paymentExpiredAt: pakasirData ? new Date(pakasirData.expired_at) : undefined,
    }).returning();

    // Insert Order Items
    await Promise.all(productData.map(async (p) => {
      await db.insert(orderItems).values({
        id: nanoid(),
        orderId: newOrder.id,
        productId: p.id!,
        quantity: p.quantity,
        priceAtPurchase: p.price!,
      });
      // Deduct stock
      await db.update(products).set({ stock: p.stock! - p.quantity }).where(eq(products.id, p.id!));
    }));

    // Clear Cart
    await db.delete(cartItems).where(eq(cartItems.userId, session.user.id));

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role") || "buyer";

    let userOrders;
    if (role === "seller") {
      userOrders = await db.query.orders.findMany({
        where: eq(orders.sellerId, session.user.id),
        with: { items: { with: { product: true } }, buyer: true },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });
    } else if (role === "courier") {
      userOrders = await db.query.orders.findMany({
        where: eq(orders.status, "processed"), // Courier can pick up processed orders
        with: { items: { with: { product: true } }, seller: true, buyer: true },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });
    } else {
      userOrders = await db.query.orders.findMany({
        where: eq(orders.buyerId, session.user.id),
        with: { items: { with: { product: true } }, seller: true },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });
    }

    return NextResponse.json(userOrders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { orderId, status } = body;

    // Check if the order exists and if the user has permission to update it
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check: 
    // Sellers can update their own orders' status
    // Couriers can update status to 'shipping' or 'completed'
    if (session.user.role === "seller") {
      if (existingOrder.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "courier") {
      // Logic for courier if needed
    } else if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Smart update based on role and status
    const updateData: any = { status, updatedAt: new Date() };
    
    if (session.user.role === "courier" && status === "shipping") {
      updateData.courierId = session.user.id;
    }

    const [updatedOrder] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
