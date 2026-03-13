import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { user, orders, products } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all sellers
    const allSellers = await db.query.user.findMany({
      where: eq(user.role, "seller"),
    });

    // Get performance for each seller
    const sellersPerformance = await Promise.all(
      allSellers.map(async (s) => {
        // Count products
        const productRes = await db.query.products.findMany({
          where: eq(products.sellerId, s.id),
        });

        // Get paid/completed orders for revenue
        const orderRes = await db.query.orders.findMany({
          where: and(
            eq(orders.sellerId, s.id),
            or(eq(orders.status, "paid"), eq(orders.status, "processed"), eq(orders.status, "shipping"), eq(orders.status, "completed"))
          ),
        });

        const totalRevenue = orderRes.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const totalSales = orderRes.length;

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          totalSales,
          totalRevenue,
          productCount: productRes.length,
        };
      })
    );

    // Get all couriers
    const allCouriers = await db.query.user.findMany({
      where: eq(user.role, "courier"),
    });

    // Get performance for each courier
    const couriersPerformance = await Promise.all(
      allCouriers.map(async (c) => {
        const deliveryRes = await db.query.orders.findMany({
          where: and(
            eq(orders.courierId, c.id),
            eq(orders.status, "completed")
          ),
        });

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          totalDeliveries: deliveryRes.length,
        };
      })
    );

    // Get overall stats (paid orders only for revenue)
    const paidOrders = await db.query.orders.findMany({
      where: or(eq(orders.status, "paid"), eq(orders.status, "processed"), eq(orders.status, "shipping"), eq(orders.status, "completed")),
    });

    const totalOrdersCount = paidOrders.length;
    const totalRevenueSum = paidOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    return NextResponse.json({
      sellers: sellersPerformance,
      couriers: couriersPerformance,
      stats: {
        totalOrders: totalOrdersCount,
        totalRevenue: totalRevenueSum,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin overview:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
