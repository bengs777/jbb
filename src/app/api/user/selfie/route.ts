import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-helpers";
import { uploadSelfieImage } from "@/lib/storage";

// POST /api/user/selfie – upload foto selfie untuk pengajuan
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 422 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 422 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `selfie_${user.id}_${Date.now()}.${ext}`;

    const url = await uploadSelfieImage(buffer, filename);
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("Selfie upload error:", e);
    return NextResponse.json({ error: e.message || "Upload gagal" }, { status: 500 });
  }
}
