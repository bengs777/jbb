import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";
import { uploadProductImage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const guard = requireRole(req, "SELLER", "ADMIN");
  if (guard instanceof NextResponse) return guard;

  try {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `product_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const url = await uploadProductImage(buffer, filename);
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}
