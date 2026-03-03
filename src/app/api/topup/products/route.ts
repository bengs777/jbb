/**
 * GET /api/topup/products?category=pulsa&operator=Telkomsel
 *
 * Kembalikan daftar produk top-up dari cache DB (synced oleh cron).
 * Auth: user login apapun.
 */

import { NextRequest } from "next/server";
import { db } from "@/db";
import { topupProducts } from "@/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { eq, and, sql } from "drizzle-orm";
import { getProducts, calculateSellPrice } from "@/lib/portalpulsa";

const USE_MOCK = process.env.PORTALPULSA_MOCK === "true";

/** Seed mock products into DB if table is empty (dev only). */
async function ensureMockSeeded() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(topupProducts);
  if (Number(count) > 0) return;

  const products = await getProducts();
  if (products.length === 0) return;

  const rows = products.map((p) => ({
    code: p.code,
    name: p.name,
    category: p.category,
    operator: p.operator,
    price: calculateSellPrice(p.price),
    cost: p.price,
    status: p.status as "available" | "empty",
  }));

  await db.insert(topupProducts).values(rows).onConflictDoNothing();
  console.log(`[topup/products] seeded ${rows.length} mock products into DB`);
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const operator = searchParams.get("operator");

  try {
    // Auto-seed on first request when running in mock mode
    if (USE_MOCK) await ensureMockSeeded();

    const conditions = [eq(topupProducts.status, "available")];
    if (category) conditions.push(eq(topupProducts.category, category));
    if (operator) conditions.push(eq(topupProducts.operator, operator));

    const products = await db
      .select()
      .from(topupProducts)
      .where(and(...conditions))
      .orderBy(topupProducts.price);

    return ok(products);
  } catch (e) {
    console.error("[topup/products] error", e);
    return err("Gagal mengambil daftar produk", 500);
  }
}
