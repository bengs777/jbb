import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";
import { db } from "@/db";
import { mikrotikVouchers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { addHotspotUser } from "@/lib/mikrotik";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const rows = await db
    .select()
    .from(mikrotikVouchers)
    .where(status ? eq(mikrotikVouchers.status, status as "unused" | "used" | "expired") : undefined)
    .orderBy(desc(mikrotikVouchers.created_at))
    .limit(200);

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const adminId = req.headers.get("x-user-id") ?? undefined;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Body kosong" }, { status: 400 });

  const { profile, count, price, duration_hours, limit_bytes_total, comment } = body as {
    profile: string;
    count: number;
    price?: number;
    duration_hours?: number;
    limit_bytes_total?: number;
    comment?: string;
  };

  if (!profile || typeof profile !== "string") {
    return NextResponse.json({ success: false, error: "profile diperlukan" }, { status: 400 });
  }
  const qty = Math.min(Math.max(1, Number(count) || 1), 100);

  const generated: { code: string; password: string }[] = [];
  const insertRows = [];

  for (let i = 0; i < qty; i++) {
    const code = `JBB-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const password = crypto.randomBytes(4).toString("hex");

    try {
      await addHotspotUser(code, password, profile, comment);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { success: false, error: `Gagal tambah user ke MikroTik: ${msg}` },
        { status: 502 }
      );
    }

    insertRows.push({
      id: crypto.randomUUID(),
      code,
      profile,
      price: Number(price) || 0,
      duration_hours: duration_hours ? Number(duration_hours) : null,
      limit_bytes_total: limit_bytes_total ? Number(limit_bytes_total) : null,
      comment: comment ?? null,
      status: "unused" as const,
      created_by: adminId ?? null,
    });

    generated.push({ code, password });
  }

  await db.insert(mikrotikVouchers).values(insertRows);

  return NextResponse.json({ success: true, data: generated });
}
