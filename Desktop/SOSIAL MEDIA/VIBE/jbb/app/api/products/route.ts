import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get("sellerId");
    
    let query = db.query.products.findMany({
      orderBy: [desc(products.createdAt)],
      with: {
        seller: true,
      }
    });

    if (sellerId) {
      const allProducts = await db.select().from(products).where(eq(products.sellerId, sellerId)).orderBy(desc(products.createdAt));
      return NextResponse.json(allProducts);
    }

    const allProducts = await db.query.products.findMany({
      orderBy: [desc(products.createdAt)],
      with: {
        seller: {
          columns: {
            name: true,
          }
        }
      }
    });
    
    return NextResponse.json(allProducts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, price, stock, imageUrl, category } = body;

    const [newProduct] = await db.insert(products).values({
      id: nanoid(),
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      imageUrl,
      category,
      sellerId: session.user.id,
    }).returning();

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
