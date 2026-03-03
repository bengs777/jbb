import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, cartItems, users } from "@/db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import type { Order } from "@/db/schema";
import { checkoutSchema } from "@/lib/validations";
import { createMayarPayment } from "@/lib/mayar";
import { getExpiredAt, classifyEarnings } from "@/lib/utils";

// GET /api/orders - Orders list based on role
export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    let rows: Order[] = [];

    if (user.role === "ADMIN") {
      rows = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.created_at))
        .limit(100);
    } else if (user.role === "SELLER") {
      rows = await db
        .select()
        .from(orders)
        .where(eq(orders.seller_id, user.id))
        .orderBy(desc(orders.created_at));
    } else if (user.role === "KURIR") {
      rows = await db
        .select()
        .from(orders)
        .where(eq(orders.kurir_id, user.id))
        .orderBy(desc(orders.created_at));
    } else {
      // BUYER — include seller & kurir contact info
      const sellerUser = alias(users, "seller_user");
      const kurirUser = alias(users, "kurir_user");
      const rows = await db
        .select({
          id: orders.id,
          total_bayar: orders.total_bayar,
          status_pembayaran: orders.status_pembayaran,
          status_pesanan: orders.status_pesanan,
          alamat_pengiriman: orders.alamat_pengiriman,
          created_at: orders.created_at,
          expired_at: orders.expired_at,
          seller_name: sellerUser.name,
          seller_no_hp: sellerUser.no_hp,
          kurir_name: kurirUser.name,
          kurir_no_hp: kurirUser.no_hp,
        })
        .from(orders)
        .innerJoin(sellerUser, eq(orders.seller_id, sellerUser.id))
        .leftJoin(kurirUser, eq(orders.kurir_id, kurirUser.id))
        .where(eq(orders.buyer_id, user.id))
        .orderBy(desc(orders.created_at));
      return ok(rows);
    }
  } catch (e) {
    console.error("[GET /api/orders]", e);
    return err("Gagal mengambil pesanan", 500);
  }
}

// POST /api/orders - Checkout
export async function POST(req: NextRequest) {
  const guard = requireAuth(req);
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422);

    const { nama_penerima, no_hp_penerima, alamat_pengiriman, items } = parsed.data;

    // Validate and collect product data in one query
    const productIds = items.map((i) => i.product_id);
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    if (productRows.length !== productIds.length) {
      return err("Beberapa produk tidak ditemukan", 400);
    }

    const productMap = new Map(productRows.map((p) => [p.id, p]));

    // Validate all are from same seller & active, check stock
    let sellerId: string | null = null;
    let totalProduk = 0;

    for (const item of items) {
      const product = productMap.get(item.product_id)!;
      if (product.status === "INACTIVE") {
        return err(`Produk "${product.nama}" tidak aktif`, 400);
      }
      if (product.stok < item.qty) {
        return err(`Stok "${product.nama}" tidak cukup (tersisa ${product.stok})`, 400);
      }
      if (!sellerId) sellerId = product.seller_id;
      else if (sellerId !== product.seller_id) {
        return err("Semua produk harus dari seller yang sama", 400);
      }
      totalProduk += product.harga * item.qty;
    }

    // Dynamic fees: every 1-2 items → kurir Rp1.500; admin flat Rp1.000
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const feeKurir = Math.ceil(totalQty / 2) * 1500;
    const feeAdmin = 1000;
    const totalBayar = totalProduk + feeKurir + feeAdmin;
    const expiredAt = getExpiredAt(5);
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Fetch buyer info + ensure user row exists — both needed before transaction
    const [buyerRow] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, user.id));

    if (!buyerRow) {
      await db.insert(users).values({
        id: user.id,
        name: user.email.split("@")[0],
        email: user.email,
        role: "BUYER",
        is_active: true,
      }).onConflictDoNothing();
    }

    // Atomic transaction: create order + deduct stock + clear cart
    await db.transaction(async (tx) => {
      // Create order
      await tx.insert(orders).values({
        id: orderId,
        buyer_id: user.id,
        seller_id: sellerId!,
        nama_penerima,
        no_hp_penerima,
        alamat_pengiriman,
        total_produk: totalProduk,
        fee_kurir: feeKurir,
        fee_admin: feeAdmin,
        total_bayar: totalBayar,
        status_pembayaran: "UNPAID",
        status_pesanan: "MENUNGGU",
        expired_at: expiredAt,
        created_at: now,
        updated_at: now,
      });

      // Create order items (batched) & deduct stock
      await tx.insert(orderItems).values(
        items.map((item) => ({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: item.product_id,
          qty: item.qty,
          harga: productMap.get(item.product_id)!.harga,
        }))
      );

      for (const item of items) {
        await tx
          .update(products)
          .set({ stok: sql`${products.stok} - ${item.qty}`, updated_at: now })
          .where(eq(products.id, item.product_id));
      }

      // Clear buyer's cart
      await tx
        .delete(cartItems)
        .where(eq(cartItems.user_id, user.id));
    });

    // Create Mayar.id payment link outside of DB transaction
    let paymentUrl: string | null = null;
    let paymentId: string | null = null;
    try {
      const mayar = await createMayarPayment({
        orderId,
        amount: totalBayar,
        description: `JBB Order #${orderId.slice(0, 8).toUpperCase()}`,
        customerName: buyerRow?.name ?? user.email.split("@")[0],
        customerEmail: buyerRow?.email ?? user.email,
      });

      paymentUrl = mayar.paymentUrl;
      paymentId = mayar.paymentId;

      await db
        .update(orders)
        .set({ qris_url: paymentUrl, qris_id: paymentId, updated_at: new Date().toISOString() })
        .where(eq(orders.id, orderId));
    } catch (payErr) {
      console.error("[Mayar payment creation failed]", payErr);
    }

    return ok(
      {
        order_id: orderId,
        total_bayar: totalBayar,
        payment_url: paymentUrl,
        expired_at: expiredAt,
      },
      201
    );
  } catch (e) {
    console.error("[POST /api/orders - checkout]", e);
    return err("Checkout gagal", 500);
  }
}
