import { NextRequest } from "next/server";
import { db } from "@/db";
import { sellerEarnings, orders } from "@/db/schema";
import { eq, desc, sum } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const guard = requireRole(req, "SELLER", "ADMIN");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const rows = await db
      .select()
      .from(sellerEarnings)
      .where(user.role === "ADMIN" ? undefined : eq(sellerEarnings.seller_id, user.id))
      .orderBy(desc(sellerEarnings.tanggal));

    const totalResult = await db
      .select({ total: sum(sellerEarnings.jumlah) })
      .from(sellerEarnings)
      .where(user.role === "ADMIN" ? undefined : eq(sellerEarnings.seller_id, user.id));

    return ok({ earnings: rows, total: Number(totalResult[0]?.total ?? 0) });
  } catch (e) {
    console.error("[GET /api/seller/earnings]", e);
    return err("Gagal mengambil earnings", 500);
  }
}
