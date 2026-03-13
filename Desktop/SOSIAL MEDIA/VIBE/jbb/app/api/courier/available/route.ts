import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { orders, user } from "@/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET /api/courier/available - List available orders for courier (status: processed)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "courier") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const availableOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.status, "processed"),
        isNull(orders.courierId)
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
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    return NextResponse.json(availableOrders);
  } catch (error) {
    console.error("[API_COURIER_AVAILABLE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
