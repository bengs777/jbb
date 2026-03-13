import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { payoutRequests, user } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await db.query.payoutRequests.findMany({
      with: {
        seller: true,
      },
      orderBy: [desc(payoutRequests.createdAt)],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch payout requests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, adminNote } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const updated = await db
      .update(payoutRequests)
      .set({ 
        status, 
        adminNote,
        updatedAt: new Date() 
      })
      .where(eq(payoutRequests.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update payout request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
