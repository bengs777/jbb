import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromRequest, ok, err } from "@/lib/api-helpers";

// GET /api/user/apply – cek status pengajuan
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return err("Unauthorized", 401);

  const row = await db
    .select({ role: users.role, pending_role: users.pending_role, apply_selfie_url: users.apply_selfie_url })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

  if (!row) return err("User tidak ditemukan", 404);
  return ok({
    role: row.role,
    pending_role: row.pending_role ?? null,
    apply_selfie_url: row.apply_selfie_url ?? null,
  });
}

// POST /api/user/apply – ajukan diri sebagai SELLER atau KURIR
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return err("Unauthorized", 401);

  const body = await req.json();
  const { target_role, selfie_url } = body;

  if (!["SELLER", "KURIR"].includes(target_role)) {
    return err("Role tidak valid. Pilih SELLER atau KURIR", 422);
  }
  if (!selfie_url || typeof selfie_url !== "string") {
    return err("Foto selfie wajib dilampirkan", 422);
  }

  // Pastikan user masih BUYER
  const row = await db
    .select({ role: users.role, pending_role: users.pending_role })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

  if (!row) return err("User tidak ditemukan", 404);
  if (row.role !== "BUYER") return err("Hanya pembeli yang bisa mengajukan diri", 400);
  if (row.pending_role) return err("Anda sudah memiliki pengajuan yang sedang menunggu", 400);

  await db
    .update(users)
    .set({ pending_role: target_role, apply_selfie_url: selfie_url, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return ok({
    message: `Pengajuan sebagai ${target_role === "SELLER" ? "Penjual" : "Kurir"} telah dikirim. Tunggu persetujuan admin.`,
  });
}

// DELETE /api/user/apply – batalkan pengajuan
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return err("Unauthorized", 401);

  await db
    .update(users)
    .set({ pending_role: null, apply_selfie_url: null, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return ok({ message: "Pengajuan berhasil dibatalkan" });
}
