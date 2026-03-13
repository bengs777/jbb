import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json([]);

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id),
      orderBy: [desc(notifications.createdAt)],
    });

    return NextResponse.json(userNotifications);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
