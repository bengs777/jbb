import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const rows = await db
      .select({
        id: products.id,
        nama: products.nama,
        deskripsi: products.deskripsi,
        harga: products.harga,
        stok: products.stok,
        kategori: products.kategori,
        foto_url: products.foto_url,
        status: products.status,
        created_at: products.created_at,
        seller_id: products.seller_id,
        seller_name: users.name,
      })
      .from(products)
      .innerJoin(users, eq(products.seller_id, users.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!rows[0]) return err("Produk tidak ditemukan", 404);
    const res = NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=60");
    return res;
  } catch (e) {
    console.error("[GET /api/products/[id]]", e);
    return err("Gagal mengambil produk", 500);
  }
}
