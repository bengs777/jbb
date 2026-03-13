import { NextRequest } from "next/server";
import { db } from "@/db";
import { payouts, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";

// GET /api/admin/payouts
export async function GET(req: NextRequest) {
  const guard = requireRole(req, "ADMIN");
  if ("status" in guard) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING | APPROVED | REJECTED

    const rows = await db
      .select({
        id: payouts.id,
        user_id: payouts.user_id,
        user_name: users.name,
        user_email: users.email,
        role: payouts.role,
        jumlah: payouts.jumlah,
        nama_bank: payouts.nama_bank,
        no_rekening: payouts.no_rekening,
        nama_pemilik: payouts.nama_pemilik,
        status: payouts.status,
        catatan_admin: payouts.catatan_admin,
        created_at: payouts.created_at,
        updated_at: payouts.updated_at,
      })
      .from(payouts)
      .leftJoin(users, eq(payouts.user_id, users.id))
      .where(status ? eq(payouts.status, status as "PENDING" | "APPROVED" | "REJECTED") : undefined)
      .orderBy(desc(payouts.created_at));

    return ok(rows);
  } catch (e) {
    console.error("[GET /api/admin/payouts]", e);
    return err("Gagal mengambil data payout", 500);
  }
}

// PATCH /api/admin/payouts - approve or reject
export async function PATCH(req: NextRequest) {
  const guard = requireRole(req, "ADMIN");
  if ("status" in guard) return guard;

  try {
    const body = await req.json();
    const { id, status, catatan_admin } = body;

    if (!id) return err("ID payout wajib diisi", 400);
    if (!["APPROVED", "REJECTED"].includes(status)) return err("Status tidak valid", 400);

    const [existing] = await db.select().from(payouts).where(eq(payouts.id, id));
    if (!existing) return err("Payout tidak ditemukan", 404);
    if (existing.status !== "PENDING") return err("Payout sudah diproses sebelumnya", 400);

    await db
      .update(payouts)
      .set({
        status,
        catatan_admin: catatan_admin ?? null,
        updated_at: new Date().toISOString(),
      })
      .where(eq(payouts.id, id));

    return ok({ message: status === "APPROVED" ? "Payout disetujui" : "Payout ditolak" });
  } catch (e) {
    console.error("[PATCH /api/admin/payouts]", e);
    return err("Gagal memproses payout", 500);
  }
}
