import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";
import { getActiveUsers, kickActiveUser } from "@/lib/mikrotik";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await getActiveUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal koneksi ke MikroTik";
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id || typeof id !== "string") {
    return NextResponse.json({ success: false, error: "id diperlukan" }, { status: 400 });
  }

  try {
    await kickActiveUser(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal kick user";
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
