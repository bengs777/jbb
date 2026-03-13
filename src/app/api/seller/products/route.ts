import { NextRequest } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";
import { createProductSchema } from "@/lib/validations";

// GET /api/seller/products - List seller's own products
export async function GET(req: NextRequest) {
  const guard = requireRole(req, "SELLER", "ADMIN");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    // Filter produk dengan kategori 'game voucher'
    const baseCondition = user.role === "ADMIN"
      ? sql`LOWER(${products.kategori}) <> 'game voucher'`
      : and(
          eq(products.seller_id, user.id),
          sql`LOWER(${products.kategori}) <> 'game voucher'`
        );
    const rows = await db
      .select()
      .from(products)
      .where(baseCondition);
    return ok(rows);
  } catch (e) {
    console.error("[GET /api/seller/products]", e);
    return err("Gagal mengambil produk", 500);
  }
}

// POST /api/seller/products - Create product
export async function POST(req: NextRequest) {
  const guard = requireRole(req, "SELLER");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.errors[0].message, 422);
    }

    const data = parsed.data;
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(products).values({
      id: newId,
      seller_id: user.id,
      nama: data.nama,
      deskripsi: data.deskripsi,
      harga: data.harga,
      stok: data.stok,
      kategori: data.kategori,
      foto_url: data.foto_url ?? null,
      status: data.status,
      created_at: now,
      updated_at: now,
    });

    const [created] = await db
      .select()
      .from(products)
      .where(eq(products.id, newId));

    return ok(created, 201);
  } catch (e) {
    console.error("[POST /api/seller/products]", e);
    return err("Gagal membuat produk", 500);
  }
}
