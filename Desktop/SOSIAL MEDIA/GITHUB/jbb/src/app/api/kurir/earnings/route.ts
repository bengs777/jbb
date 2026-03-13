import { NextRequest } from "next/server";
import { db } from "@/db";
import { kurirEarnings } from "@/db/schema";
import { eq, desc, sum } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const guard = requireRole(req, "KURIR", "ADMIN");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const rows = await db
      .select()
      .from(kurirEarnings)
      .where(user.role === "ADMIN" ? undefined : eq(kurirEarnings.kurir_id, user.id))
      .orderBy(desc(kurirEarnings.tanggal));

    const totalResult = await db
      .select({ total: sum(kurirEarnings.fee_kurir) })
      .from(kurirEarnings)
      .where(user.role === "ADMIN" ? undefined : eq(kurirEarnings.kurir_id, user.id));

    return ok({ earnings: rows, total: Number(totalResult[0]?.total ?? 0) });
  } catch (e) {
    console.error("[GET /api/kurir/earnings]", e);
    return err("Gagal mengambil earnings kurir", 500);
  }
}
