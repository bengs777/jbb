import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, stock, imageUrl, category } = body;

    // Ensure the product belongs to the seller
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.sellerId, session.user.id)),
    });

    if (!product) {
      return NextResponse.json({ error: "Unauthorized or product not found" }, { status: 403 });
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
        category,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Ensure the product belongs to the seller
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.sellerId, session.user.id)),
    });

    if (!product) {
      return NextResponse.json({ error: "Unauthorized or product not found" }, { status: 403 });
    }

    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
