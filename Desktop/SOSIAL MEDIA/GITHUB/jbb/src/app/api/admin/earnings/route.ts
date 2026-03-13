import { NextRequest } from "next/server";
import { db } from "@/db";
import { sellerEarnings, kurirEarnings, users, userBalances, orders, gameOrders } from "@/db/schema";
import { eq, desc, sum } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireRole(req, "ADMIN");
  if ("status" in guard) return guard;

  try {
    const [sellerRows, kurirRows, buyerRows, adminRows, adminTotal, gameRows, gameTotal] = await Promise.all([
      db
        .select({
          id: sellerEarnings.id,
          user_id: sellerEarnings.seller_id,
          user_name: users.name,
          order_id: sellerEarnings.order_id,
          jumlah: sellerEarnings.jumlah,
          created_at: sellerEarnings.tanggal,
          klasifikasi: sellerEarnings.klasifikasi,
          saldo: userBalances.balance,
          saldo_hold: userBalances.balance_hold,
        })
        .from(sellerEarnings)
        .innerJoin(users, eq(sellerEarnings.seller_id, users.id))
        .leftJoin(userBalances, eq(sellerEarnings.seller_id, userBalances.user_id))
        .orderBy(desc(sellerEarnings.tanggal)),
      db
        .select({
          id: kurirEarnings.id,
          user_id: kurirEarnings.kurir_id,
          user_name: users.name,
          order_id: kurirEarnings.order_id,
          jumlah: kurirEarnings.fee_kurir,
          created_at: kurirEarnings.tanggal,
          klasifikasi: kurirEarnings.klasifikasi,
          saldo: userBalances.balance,
          saldo_hold: userBalances.balance_hold,
        })
        .from(kurirEarnings)
        .innerJoin(users, eq(kurirEarnings.kurir_id, users.id))
        .leftJoin(userBalances, eq(kurirEarnings.kurir_id, userBalances.user_id))
        .orderBy(desc(kurirEarnings.tanggal)),
      db
        .select({
          user_id: users.id,
          user_name: users.name,
          email: users.email,
          saldo: userBalances.balance,
          saldo_hold: userBalances.balance_hold,
        })
        .from(users)
        .leftJoin(userBalances, eq(users.id, userBalances.user_id))
        .where(eq(users.role, "BUYER"))
        .orderBy(desc(userBalances.balance)),
      db
        .select({
          id: orders.id,
          order_id: orders.id,
          jumlah: orders.fee_admin,
          created_at: orders.created_at,
          buyer_name: users.name,
        })
        .from(orders)
        .innerJoin(users, eq(orders.buyer_id, users.id))
        .where(eq(orders.status_pembayaran, "PAID"))
        .orderBy(desc(orders.created_at)),
      db
        .select({ total: sum(orders.fee_admin) })
        .from(orders)
        .where(eq(orders.status_pembayaran, "PAID")),
      db
        .select({
          id: gameOrders.id,
          invoice_id: gameOrders.invoice_id,
          game_name: gameOrders.game_name,
          nominal_label: gameOrders.nominal_label,
          target_user_id: gameOrders.target_user_id,
          amount: gameOrders.amount,
          admin_profit: gameOrders.admin_profit,
          delivery_status: gameOrders.delivery_status,
          pp_sn: gameOrders.pp_sn,
          created_at: gameOrders.created_at,
        })
        .from(gameOrders)
        .where(eq(gameOrders.status, "PAID"))
        .orderBy(desc(gameOrders.created_at))
        .limit(200),
      db
        .select({ total: sum(gameOrders.admin_profit) })
        .from(gameOrders)
        .where(eq(gameOrders.status, "PAID")),
    ]);

    const total_seller = sellerRows.reduce((s, r) => s + (r.jumlah ?? 0), 0);
    const total_kurir = kurirRows.reduce((s, r) => s + (r.jumlah ?? 0), 0);
    const total_buyer_saldo = buyerRows.reduce((s, r) => s + (r.saldo ?? 0), 0);
    const total_admin = Number(adminTotal[0]?.total ?? 0);
    const total_game_profit = Number(gameTotal[0]?.total ?? 0);

    return ok({
      seller: sellerRows,
      kurir: kurirRows,
      buyers: buyerRows,
      admin: adminRows,
      game: gameRows,
      total_seller,
      total_kurir,
      total_buyer_saldo,
      total_admin,
      total_game_profit,
    });
  } catch (e) {
    console.error("[GET /api/admin/earnings]", e);
    return err("Gagal mengambil data earnings", 500);
  }
}
