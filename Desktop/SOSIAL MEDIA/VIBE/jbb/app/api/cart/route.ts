import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { cartItems } from "@/server/db/schema";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json([], { status: 200 });

    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, session.user.id),
      with: {
        product: {
          with: { seller: true }
        }
      }
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, quantity = 1 } = await request.json();

    // Check if item already in cart
    const existing = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.userId, session.user.id), eq(cartItems.productId, productId))
    });

    if (existing) {
      const updated = await db.update(cartItems)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return NextResponse.json(updated[0]);
    }

    const [newItem] = await db.insert(cartItems).values({
      id: nanoid(),
      userId: session.user.id,
      productId,
      quantity,
    }).returning();

    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    await db.delete(cartItems).where(eq(cartItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}
