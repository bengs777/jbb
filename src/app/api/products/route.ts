import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, users } from "@/db/schema";
import { eq, and, like, or, sql } from "drizzle-orm";
import { ok, err } from "@/lib/api-helpers";

// GET /api/products - Public catalog with search & filter
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const kategori = searchParams.get("kategori") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "12"));
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(products.status, "ACTIVE")];

    if (search) {
      conditions.push(
        or(
          like(products.nama, `%${search}%`),
          like(products.deskripsi, `%${search}%`)
        )!
      );
    }
    if (kategori) {
      conditions.push(eq(products.kategori, kategori));
    }

    const [rows, countResult] = await Promise.all([
      db
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
          seller_name: users.name,
        })
        .from(products)
        .innerJoin(users, eq(products.seller_id, users.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions)),
    ]);

    const res = NextResponse.json(
      {
        success: true,
        data: {
          products: rows,
          pagination: {
            page,
            limit,
            total: Number(countResult[0]?.count ?? 0),
            totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
          },
        },
      },
      { status: 200 }
    );
    // Cache public catalog for 60s at CDN/browser, allow serving stale for 30s
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    return res;
  } catch (e) {
    console.error("[GET /api/products]", e);
    return err("Gagal mengambil produk", 500);
  }
}
