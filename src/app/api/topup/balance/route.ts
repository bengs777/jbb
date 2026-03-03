/**
 * GET /api/topup/balance
 * Kembalikan saldo user yang sedang login.
 */

import { NextRequest } from "next/server";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { getBalance } from "@/lib/balance";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("status" in auth) return auth;

  try {
    const bal = await getBalance(auth.user.id);
    return ok(bal);
  } catch (e) {
    return err("Gagal mengambil saldo", 500);
  }
}
