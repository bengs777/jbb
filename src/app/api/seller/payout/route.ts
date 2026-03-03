import { NextRequest } from "next/server";
import { db } from "@/db";
import { payouts, sellerEarnings } from "@/db/schema";
import { eq, sum, desc } from "drizzle-orm";
import { requireRole, ok, err } from "@/lib/api-helpers";

// GET /api/seller/payout - list payout requests for this seller
export async function GET(req: NextRequest) {
  const guard = requireRole(req, "SELLER");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const rows = await db
      .select()
      .from(payouts)
      .where(eq(payouts.user_id, user.id))
      .orderBy(desc(payouts.created_at));

    const totalEarnings = await db
      .select({ total: sum(sellerEarnings.jumlah) })
      .from(sellerEarnings)
      .where(eq(sellerEarnings.seller_id, user.id));

    const totalPaidOut = rows
      .filter((p) => p.status === "APPROVED")
      .reduce((s, p) => s + p.jumlah, 0);

    const saldo = Number(totalEarnings[0]?.total ?? 0) - totalPaidOut;

    return ok({ payouts: rows, saldo });
  } catch (e) {
    console.error("[GET /api/seller/payout]", e);
    return err("Gagal mengambil data payout", 500);
  }
}

// POST /api/seller/payout - request a payout
export async function POST(req: NextRequest) {
  const guard = requireRole(req, "SELLER");
  if ("status" in guard) return guard;
  const { user } = guard;

  try {
    const body = await req.json();
    const { jumlah, nama_bank, no_rekening, nama_pemilik } = body;

    if (!jumlah || jumlah <= 0) return err("Jumlah payout tidak valid", 400);
    if (!nama_bank?.trim()) return err("Nama bank wajib diisi", 400);
    if (!no_rekening?.trim()) return err("Nomor rekening wajib diisi", 400);
    if (!nama_pemilik?.trim()) return err("Nama pemilik rekening wajib diisi", 400);

    // Check for pending request
    const [pending] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.user_id, user.id))
      .orderBy(desc(payouts.created_at));

    if (pending?.status === "PENDING") {
      return err("Masih ada permintaan payout yang menunggu persetujuan", 400);
    }

    // Check saldo
    const totalEarnings = await db
      .select({ total: sum(sellerEarnings.jumlah) })
      .from(sellerEarnings)
      .where(eq(sellerEarnings.seller_id, user.id));

    const approved = await db
      .select()
      .from(payouts)
      .where(eq(payouts.user_id, user.id));

    const totalPaidOut = approved
      .filter((p) => p.status === "APPROVED")
      .reduce((s, p) => s + p.jumlah, 0);

    const saldo = Number(totalEarnings[0]?.total ?? 0) - totalPaidOut;
    if (jumlah > saldo) return err(`Saldo tidak cukup. Saldo Anda: Rp ${saldo.toLocaleString("id-ID")}`, 400);

    const now = new Date().toISOString();
    await db.insert(payouts).values({
      id: crypto.randomUUID(),
      user_id: user.id,
      role: "SELLER",
      jumlah,
      nama_bank,
      no_rekening,
      nama_pemilik,
      status: "PENDING",
      created_at: now,
      updated_at: now,
    });

    return ok({ message: "Permintaan payout berhasil dikirim" }, 201);
  } catch (e) {
    console.error("[POST /api/seller/payout]", e);
    return err("Gagal mengirim permintaan payout", 500);
  }
}
