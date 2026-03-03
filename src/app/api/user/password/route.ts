import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromRequest, ok, err } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

// POST /api/user/password – buat atau ganti password
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return err("Unauthorized", 401);

  const body = await req.json();
  const { current_password, new_password } = body;

  if (!new_password) return err("Password baru wajib diisi", 422);
  if (new_password.length < 6) return err("Password baru minimal 6 karakter", 422);

  const row = await db
    .select({ password_hash: users.password_hash })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

  const hasExistingPassword = !!row?.password_hash;

  if (hasExistingPassword) {
    // Harus verifikasi password lama
    if (!current_password) return err("Password saat ini wajib diisi", 422);
    const valid = await bcrypt.compare(current_password, row!.password_hash!);
    if (!valid) return err("Password saat ini tidak benar", 401);
  }
  // Jika belum punya password (akun Google), langsung set password baru

  const newHash = await bcrypt.hash(new_password, 12);
  await db
    .update(users)
    .set({ password_hash: newHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return ok({
    message: hasExistingPassword ? "Password berhasil diubah" : "Password berhasil dibuat",
    had_password: hasExistingPassword,
  });
}
