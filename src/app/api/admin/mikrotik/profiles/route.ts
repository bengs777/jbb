import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";
import { getProfiles } from "@/lib/mikrotik";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const profiles = await getProfiles();
    return NextResponse.json({ success: true, data: profiles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message ?? "Gagal koneksi ke MikroTik" }, { status: 502 });
  }
}
