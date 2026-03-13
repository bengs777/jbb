/**
 * GET /api/topup/transactions?page=1&limit=20
 * Riwayat transaksi top-up milik user yang login.
 */

import { NextRequest } from "next/server";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { db } from "@/db";
import { topupTransactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ("status" in auth) return auth;
  const { user } = auth;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const offset = (page - 1) * limit;

  try {
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(topupTransactions)
        .where(eq(topupTransactions.user_id, user.id))
        .orderBy(desc(topupTransactions.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(topupTransactions)
        .where(eq(topupTransactions.user_id, user.id)),
    ]);

    return ok({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (e) {
    return err("Gagal mengambil riwayat transaksi", 500);
  }
}
