import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const guard = requireRole(req, "SELLER");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const rows = await db
      .select({
        id: orders.id,
        buyer_id: orders.buyer_id,
        kurir_id: orders.kurir_id,
        total_produk: orders.total_produk,
        total_bayar: orders.total_bayar,
        fee_kurir: orders.fee_kurir,
        fee_admin: orders.fee_admin,
        status_pembayaran: orders.status_pembayaran,
        status_pesanan: orders.status_pesanan,
        alamat_pengiriman: orders.alamat_pengiriman,
        expired_at: orders.expired_at,
        created_at: orders.created_at,
        buyer_name: users.name,
        buyer_no_hp: users.no_hp,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyer_id, users.id))
      .where(eq(orders.seller_id, user.id))
      .orderBy(desc(orders.created_at));

    return ok(rows);
  } catch (e) {
    console.error("[GET /api/seller/orders]", e);
    return err("Gagal mengambil pesanan", 500);
  }
}
