import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { user, products } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const seller = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!seller || seller.role !== "seller") {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerProducts = await db.query.products.findMany({
      where: eq(products.sellerId, id),
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    return NextResponse.json({
      seller: {
        id: seller.id,
        name: seller.name,
        image: seller.image,
        createdAt: seller.createdAt,
      },
      products: sellerProducts,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch seller" }, { status: 500 });
  }
}
