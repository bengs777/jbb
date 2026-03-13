import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { role, name, image } = body;
    
    const updateData: any = {};
    if (role && ['buyer', 'seller', 'courier', 'admin'].includes(role)) {
      updateData.role = role;
    }
    if (name) updateData.name = name;
    if (image !== undefined) updateData.image = image;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No data to update" }, { status: 400 });
    }

    await db.update(user)
      .set(updateData)
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
