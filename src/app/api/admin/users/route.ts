import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc, and, sql, isNotNull } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";
import { activateUserSchema, updateUserRoleSchema } from "@/lib/validations";

// GET /api/admin/users
// ?pending_sellers=true       → SELLER/KURIR dengan is_active=0 (legacy)
// ?pending_applications=true  → user dengan pending_role IS NOT NULL
export async function GET(req: NextRequest) {
  const guard = requireRole(req, "ADMIN");
  if ("status" in guard) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const pendingSellers = searchParams.get("pending_sellers") === "true";
    const pendingApplications = searchParams.get("pending_applications") === "true";
    const roleFilter = searchParams.get("role"); // e.g. SELLER, KURIR

    const baseSelect = {
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      is_active: users.is_active,
      alamat: users.alamat,
      no_hp: users.no_hp,
      pending_role: users.pending_role,
      apply_selfie_url: users.apply_selfie_url,
      created_at: users.createdAt,
    };

    let rows;
    if (pendingApplications) {
      rows = await db
        .select(baseSelect)
        .from(users)
        .where(isNotNull(users.pending_role))
        .orderBy(desc(users.createdAt));
    } else if (pendingSellers) {
      rows = await db
        .select(baseSelect)
        .from(users)
        .where(
          and(
            sql`${users.role} IN ('SELLER', 'KURIR')`,
            sql`${users.is_active} = 0`
          )
        )
        .orderBy(desc(users.createdAt));
    } else if (roleFilter && ["SELLER", "KURIR", "BUYER", "ADMIN"].includes(roleFilter)) {
      rows = await db
        .select(baseSelect)
        .from(users)
        .where(eq(users.role, roleFilter as "SELLER" | "KURIR" | "BUYER" | "ADMIN"))
        .orderBy(desc(users.createdAt));
    } else {
      rows = await db
        .select(baseSelect)
        .from(users)
        .orderBy(desc(users.createdAt));
    }

    return ok(rows);
  } catch (e) {
    console.error("[GET /api/admin/users]", e);
    return err("Gagal mengambil data user", 500);
  }
}

// PATCH /api/admin/users
export async function PATCH(req: NextRequest) {
  const guard = requireRole(req, "ADMIN");
  if ("status" in guard) return guard;

  try {
    const body = await req.json();

    // Approve pending application
    if (body.approve_pending && body.user_id) {
      const row = await db
        .select({ pending_role: users.pending_role })
        .from(users)
        .where(eq(users.id, body.user_id))
        .get();
      if (!row?.pending_role) return err("Tidak ada pengajuan untuk user ini", 400);
      await db
        .update(users)
        .set({ role: row.pending_role, pending_role: null, updatedAt: new Date() })
        .where(eq(users.id, body.user_id));
      return ok({ message: `Pengajuan disetujui — role diubah ke ${row.pending_role}` });
    }

    // Reject pending application
    if (body.reject_pending && body.user_id) {
      await db
        .update(users)
        .set({ pending_role: null, updatedAt: new Date() })
        .where(eq(users.id, body.user_id));
      return ok({ message: "Pengajuan ditolak" });
    }

    if ("is_active" in body) {
      const parsed = activateUserSchema.safeParse(body);
      if (!parsed.success) return err(parsed.error.errors[0].message, 422);
      await db
        .update(users)
        .set({ is_active: parsed.data.is_active, updatedAt: new Date() })
        .where(eq(users.id, parsed.data.user_id));
      return ok({ message: `User ${parsed.data.is_active ? "diaktifkan" : "dinonaktifkan"}` });
    }

    if ("role" in body) {
      const parsed = updateUserRoleSchema.safeParse(body);
      if (!parsed.success) return err(parsed.error.errors[0].message, 422);
      await db
        .update(users)
        .set({ role: parsed.data.role, updatedAt: new Date() })
        .where(eq(users.id, parsed.data.user_id));
      return ok({ message: "Role user diperbarui" });
    }

    return err("Payload tidak valid", 400);
  } catch (e) {
    console.error("[PATCH /api/admin/users]", e);
    return err("Gagal update user", 500);
  }
}
