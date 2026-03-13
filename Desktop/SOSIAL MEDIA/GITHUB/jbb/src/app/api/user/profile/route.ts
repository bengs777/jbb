import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, orders, orderItems, sellerEarnings, kurirEarnings } from "@/db/schema";
import { eq, or, inArray } from "drizzle-orm";
import { getUserFromRequest, ok, err } from "@/lib/api-helpers";

// GET /api/user/profile
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return err("Unauthorized", 401);

  const row = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      alamat: users.alamat,
      no_hp: users.no_hp,
      createdAt: users.createdAt,
      has_password: users.password_hash,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

  if (!row) return err("User tidak ditemukan", 404);
  return ok({ ...row, has_password: !!row.has_password });
}

// PATCH /api/user/profile – update name, alamat, no_hp
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return err("Unauthorized", 401);

  const body = await req.json();
  const { name, alamat, no_hp } = body;

  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
    return err("Nama minimal 2 karakter", 422);
  }

  await db
    .update(users)
    .set({
      ...(name !== undefined && { name: name.trim() }),
      ...(alamat !== undefined && { alamat }),
      ...(no_hp !== undefined && { no_hp }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return ok({ message: "Profil berhasil diperbarui" });
}

// DELETE /api/user/profile – hapus akun + semua sesi
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return err("Unauthorized", 401);

  // 1. Kumpulkan semua order terkait user (sebagai buyer, seller, maupun kurir)
  const relatedOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      or(
        eq(orders.buyer_id, user.id),
        eq(orders.seller_id, user.id),
        eq(orders.kurir_id, user.id),
      )
    );
  const orderIds = relatedOrders.map((o) => o.id);

  if (orderIds.length > 0) {
    // 2. Hapus earnings dulu (FK ke orders tanpa cascade)
    await db.delete(sellerEarnings).where(inArray(sellerEarnings.order_id, orderIds));
    await db.delete(kurirEarnings).where(inArray(kurirEarnings.order_id, orderIds));
    // 3. Hapus order items (FK ke orders dengan cascade, tapi eksplisit lebih aman)
    await db.delete(orderItems).where(inArray(orderItems.order_id, orderIds));
    // 4. Hapus orders
    await db.delete(orders).where(inArray(orders.id, orderIds));
  }

  // 5. Hapus user — cascade otomatis: sessions, accounts, cartItems, products
  await db.delete(users).where(eq(users.id, user.id));

  return ok({ message: "Akun berhasil dihapus" });
}
