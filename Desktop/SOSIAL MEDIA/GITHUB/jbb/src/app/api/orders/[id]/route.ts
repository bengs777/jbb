import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, kurirEarnings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";
import { classifyEarnings } from "@/lib/utils";

// GET /api/orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = requireRole(req, "BUYER", "SELLER", "KURIR", "ADMIN");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    if (!order) return err("Order tidak ditemukan", 404);

    // Check ownership
    if (
      user.role !== "ADMIN" &&
      order.buyer_id !== user.id &&
      order.seller_id !== user.id &&
      order.kurir_id !== user.id
    ) {
      return err("Akses ditolak", 403);
    }

    const items = await db
      .select({
        id: orderItems.id,
        qty: orderItems.qty,
        harga: orderItems.harga,
        product_id: products.id,
        product_nama: products.nama,
        product_foto: products.foto_url,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.product_id, products.id))
      .where(eq(orderItems.order_id, id));

    return ok({ ...order, items });
  } catch (e) {
    console.error("[GET /api/orders/[id]]", e);
    return err("Gagal mengambil pesanan", 500);
  }
}

// PATCH /api/orders/[id] - Cancel order (BUYER) or update status (KURIR/SELLER)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = requireRole(req, "BUYER", "SELLER", "KURIR", "ADMIN");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return err("Order tidak ditemukan", 404);

    const body = await req.json();
    const now = new Date().toISOString();

    // BUYER can cancel UNPAID orders
    if (user.role === "BUYER") {
      if (order.buyer_id !== user.id) return err("Bukan pesanan Anda", 403);
      if (order.status_pembayaran !== "UNPAID") {
        return err("Hanya order UNPAID yang bisa dibatalkan", 400);
      }
      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ status_pembayaran: "CANCELLED", updated_at: now })
          .where(eq(orders.id, id));

        // Restore stock
        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.order_id, id));

        const { sql } = await import("drizzle-orm");
        for (const item of items) {
          await tx
            .update(products)
            .set({
              stok: sql`${products.stok} + ${item.qty}`,
              updated_at: now,
            })
            .where(eq(products.id, item.product_id));
        }
      });
      return ok({ message: "Order dibatalkan" });
    }

    // KURIR can self-assign unassigned orders or update status
    if (user.role === "KURIR") {
      // Self-assign: claim an order that has no kurir yet
      if (body.action === "self_assign") {
        if (order.kurir_id) return err("Pesanan sudah diambil kurir lain", 409);
        if (order.status_pembayaran !== "PAID") return err("Order belum dibayar", 400);
        await db.transaction(async (tx) => {
          await tx
            .update(orders)
            .set({ kurir_id: user.id, updated_at: now })
            .where(eq(orders.id, id));
          // Create earnings immediately — order is already PAID
          await tx.insert(kurirEarnings).values({
            id: crypto.randomUUID(),
            kurir_id: user.id,
            order_id: id,
            fee_kurir: order.fee_kurir,
            tanggal: now,
            klasifikasi: classifyEarnings(order.fee_kurir),
          });
        });
        return ok({ message: "Pesanan berhasil diambil" });
      }

      if (order.kurir_id !== user.id) return err("Bukan pesanan Anda", 403);
      const allowed = ["MENUNGGU", "DIANTAR", "SELESAI"];
      if (!allowed.includes(body.status_pesanan)) {
        return err("Status tidak valid", 400);
      }
      if (order.status_pembayaran !== "PAID") {
        return err("Order belum dibayar", 400);
      }
      await db
        .update(orders)
        .set({ status_pesanan: body.status_pesanan, updated_at: now })
        .where(eq(orders.id, id));
      return ok({ message: "Status pesanan diperbarui" });
    }

    // SELLER can assign kurir
    if (user.role === "SELLER") {
      if (order.seller_id !== user.id) return err("Bukan pesanan Anda", 403);
      if (!body.kurir_id) return err("kurir_id wajib diisi", 400);
      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ kurir_id: body.kurir_id, updated_at: now })
          .where(eq(orders.id, id));
        // Create earnings if order is already PAID and kurir wasn't previously assigned
        if (order.status_pembayaran === "PAID" && !order.kurir_id) {
          await tx.insert(kurirEarnings).values({
            id: crypto.randomUUID(),
            kurir_id: body.kurir_id,
            order_id: id,
            fee_kurir: order.fee_kurir,
            tanggal: now,
            klasifikasi: classifyEarnings(order.fee_kurir),
          });
        }
      });
      return ok({ message: "Kurir berhasil di-assign" });
    }

    // ADMIN can update anything
    if (user.role === "ADMIN") {
      const updateData: Record<string, unknown> = { updated_at: now };
      if (body.status_pembayaran) updateData.status_pembayaran = body.status_pembayaran;
      if (body.status_pesanan) updateData.status_pesanan = body.status_pesanan;
      if (body.kurir_id) updateData.kurir_id = body.kurir_id;
      await db.transaction(async (tx) => {
        await tx.update(orders).set(updateData).where(eq(orders.id, id));
        // Create earnings if admin assigns a kurir to an already-PAID order
        if (body.kurir_id && !order.kurir_id && order.status_pembayaran === "PAID") {
          await tx.insert(kurirEarnings).values({
            id: crypto.randomUUID(),
            kurir_id: body.kurir_id,
            order_id: id,
            fee_kurir: order.fee_kurir,
            tanggal: now,
            klasifikasi: classifyEarnings(order.fee_kurir),
          });
        }
      });
      return ok({ message: "Order diperbarui" });
    }

    return err("Aksi tidak diizinkan", 403);
  } catch (e) {
    console.error("[PATCH /api/orders/[id]]", e);
    return err("Gagal update order", 500);
  }
}
