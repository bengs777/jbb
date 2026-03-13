import { NextRequest } from "next/server";
import { db } from "@/db";
import { cartItems, products, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { cartItemSchema } from "@/lib/validations";

// GET /api/cart - Get current user's cart
export async function GET(req: NextRequest) {
  const guard = requireAuth(req);
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const rows = await db
      .select({
        id: cartItems.id,
        user_id: cartItems.user_id,
        qty: cartItems.qty,
        product_id: products.id,
        product_nama: products.nama,
        product_harga: products.harga,
        product_stok: products.stok,
        product_foto: products.foto_url,
        product_status: products.status,
        seller_id: products.seller_id,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.product_id, products.id))
      .where(eq(cartItems.user_id, user.id));

    return ok(rows);
  } catch (e) {
    console.error("[GET /api/cart]", e);
    return err("Gagal mengambil keranjang", 500);
  }
}

// POST /api/cart - Add/update cart item
export async function POST(req: NextRequest) {
  const guard = requireAuth(req);
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const body = await req.json();
    const parsed = cartItemSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422);

    const { product_id, qty } = parsed.data;

    // Check product exists and is active
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, product_id), eq(products.status, "ACTIVE")));

    if (!product) return err("Produk tidak ditemukan atau tidak aktif", 404);
    if (product.stok < qty) return err("Stok tidak cukup", 400);

    // Ensure the user row exists in our users table (FK guard).
    // Google OAuth / new users may have a session before their row is committed.
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, user.id));

    if (!existingUser) {
      await db.insert(users).values({
        id: user.id,
        name: user.email.split("@")[0],
        email: user.email,
        role: "BUYER",
        is_active: true,
      }).onConflictDoNothing();
    }

    // Upsert cart item
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.user_id, user.id), eq(cartItems.product_id, product_id)));

    if (existing) {
      await db
        .update(cartItems)
        .set({ qty })
        .where(and(eq(cartItems.user_id, user.id), eq(cartItems.product_id, product_id)));
    } else {
      await db.insert(cartItems).values({
        id: crypto.randomUUID(),
        user_id: user.id,
        product_id,
        qty,
        created_at: new Date().toISOString(),
      });
    }

    return ok({ message: "Keranjang diperbarui" });
  } catch (e) {
    console.error("[POST /api/cart]", e);
    return err("Gagal update keranjang", 500);
  }
}

// DELETE /api/cart?product_id=... - Remove from cart
export async function DELETE(req: NextRequest) {
  const guard = requireAuth(req);
  if ("status" in guard) return guard;
  const { user } = guard;

  const product_id = new URL(req.url).searchParams.get("product_id");
  if (!product_id) return err("product_id wajib diisi", 400);

  try {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.user_id, user.id), eq(cartItems.product_id, product_id)));
    return ok({ message: "Item dihapus dari keranjang" });
  } catch (e) {
    return err("Gagal hapus item", 500);
  }
}
