import { NextRequest } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";
import { updateProductSchema } from "@/lib/validations";

// GET /api/seller/products/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = requireRole(req, "SELLER", "ADMIN");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const [row] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, id),
          user.role === "ADMIN" ? undefined : eq(products.seller_id, user.id)
        )
      );
    if (!row) return err("Produk tidak ditemukan", 404);
    return ok(row);
  } catch (e) {
    return err("Gagal mengambil produk", 500);
  }
}

// PUT /api/seller/products/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = requireRole(req, "SELLER", "ADMIN");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!existing) return err("Produk tidak ditemukan", 404);
    if (user.role !== "ADMIN" && existing.seller_id !== user.id) {
      return err("Tidak bisa edit produk seller lain", 403);
    }

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422);

    await db
      .update(products)
      .set({ ...parsed.data, updated_at: new Date().toISOString() })
      .where(eq(products.id, id));

    const [updated] = await db.select().from(products).where(eq(products.id, id));
    return ok(updated);
  } catch (e) {
    console.error("[PUT /api/seller/products/[id]]", e);
    return err("Gagal update produk", 500);
  }
}

// DELETE /api/seller/products/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = requireRole(req, "SELLER", "ADMIN");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!existing) return err("Produk tidak ditemukan", 404);
    if (user.role !== "ADMIN" && existing.seller_id !== user.id) {
      return err("Tidak bisa hapus produk seller lain", 403);
    }

    await db.delete(products).where(eq(products.id, id));
    return ok({ message: "Produk berhasil dihapus" });
  } catch (e) {
    console.error("[DELETE /api/seller/products/[id]]", e);
    return err("Gagal hapus produk", 500);
  }
}
