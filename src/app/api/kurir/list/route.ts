import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";

// GET /api/kurir/list – Used by seller to get available kurir
export async function GET(req: NextRequest) {
  const guard = requireRole(req, "SELLER", "ADMIN");
  if ("status" in guard) return guard;

  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        no_hp: users.no_hp,
        alamat: users.alamat,
      })
      .from(users)
      .where(and(eq(users.role, "KURIR"), eq(users.is_active, true)));

    return ok(rows);
  } catch (e) {
    return err("Gagal mengambil data kurir", 500);
  }
}
