import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, users, orderItems, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { requireRole, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const guard = requireRole(req, "KURIR");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const buyer = alias(users, "buyer");
    const seller = alias(users, "seller");

    const rows = await db
      .select({
        id: orders.id,
        total_bayar: orders.total_bayar,
        fee_kurir: orders.fee_kurir,
        status_pembayaran: orders.status_pembayaran,
        status_pesanan: orders.status_pesanan,
        alamat_pengiriman: orders.alamat_pengiriman,
        nama_penerima: orders.nama_penerima,
        no_hp_penerima: orders.no_hp_penerima,
        created_at: orders.created_at,
        buyer_name: buyer.name,
        buyer_no_hp: buyer.no_hp,
        seller_name: seller.name,
        seller_no_hp: seller.no_hp,
      })
      .from(orders)
      .innerJoin(buyer, eq(orders.buyer_id, buyer.id))
      .innerJoin(seller, eq(orders.seller_id, seller.id))
      .where(eq(orders.kurir_id, user.id))
      .orderBy(desc(orders.created_at));

    const withItems = await Promise.all(
      rows.map(async (o) => {
        const items = await db
          .select({
            product_id: orderItems.product_id,
            qty: orderItems.qty,
            harga: orderItems.harga,
            product_name: products.nama,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.product_id, products.id))
          .where(eq(orderItems.order_id, o.id));
        return { ...o, items };
      })
    );

    return ok(withItems);
  } catch (e) {
    console.error("[GET /api/kurir/orders]", e);
    return err("Gagal mengambil pesanan kurir", 500);
  }
}
