import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, users, sellerEarnings, kurirEarnings } from "@/db/schema";
import { eq, desc, sum, count, and, sql } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireRole(req, "ADMIN");
  if ("status" in guard) return guard;

  try {
    const [
      allOrders,
      totalRevenue,
      paidCount,
      totalCount,
      todayRevenue,
      totalSellerEarnings,
      totalKurirEarnings,
    ] = await Promise.all([
      db
        .select({
          id: orders.id,
          total_bayar: orders.total_bayar,
          status_pembayaran: orders.status_pembayaran,
          status_pesanan: orders.status_pesanan,
          created_at: orders.created_at,
          buyer_name: users.name,
        })
        .from(orders)
        .innerJoin(users, eq(orders.buyer_id, users.id))
        .orderBy(desc(orders.created_at))
        .limit(100),
      db
        .select({ total: sum(orders.total_bayar) })
        .from(orders)
        .where(eq(orders.status_pembayaran, "PAID")),
      db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status_pembayaran, "PAID")),
      db.select({ count: count() }).from(orders),
      db
        .select({ total: sum(orders.total_bayar) })
        .from(orders)
        .where(
          and(
            eq(orders.status_pembayaran, "PAID"),
            sql`date(${orders.created_at}) = date('now')`
          )
        ),
      db.select({ total: sum(sellerEarnings.jumlah) }).from(sellerEarnings),
      db.select({ total: sum(kurirEarnings.fee_kurir) }).from(kurirEarnings),
    ]);

    return ok({
      orders: allOrders,
      stats: {
        total_orders: Number(totalCount[0]?.count ?? 0),
        paid_orders: Number(paidCount[0]?.count ?? 0),
        total_revenue: Number(totalRevenue[0]?.total ?? 0),
        today_revenue: Number(todayRevenue[0]?.total ?? 0),
        total_seller_earnings: Number(totalSellerEarnings[0]?.total ?? 0),
        total_kurir_earnings: Number(totalKurirEarnings[0]?.total ?? 0),
      },
    });
  } catch (e) {
    console.error("[GET /api/admin/orders]", e);
    return err("Gagal mengambil data admin", 500);
  }
}
