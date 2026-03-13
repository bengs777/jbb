import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import { orders, payoutRequests } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sum, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.user.id;

    // Calculate total revenue (paid, processed, shipping, completed)
    const revenueData = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(
        and(
          eq(orders.sellerId, sellerId),
          sql`${orders.status} IN ('paid', 'processed', 'shipping', 'completed')`
        )
      );

    const totalRevenue = Number(revenueData[0]?.total || 0);

    // Calculate total paid/pending payouts
    const payoutData = await db
      .select({ total: sum(payoutRequests.amount) })
      .from(payoutRequests)
      .where(
        and(
          eq(payoutRequests.sellerId, sellerId),
          sql`${payoutRequests.status} IN ('pending', 'completed')`
        )
      );

    const totalPayouts = Number(payoutData[0]?.total || 0);
    const balance = totalRevenue - totalPayouts;

    // Get payout history
    const history = await db.query.payoutRequests.findMany({
      where: eq(payoutRequests.sellerId, sellerId),
      orderBy: (payouts, { desc }) => [desc(payouts.createdAt)],
    });

    return NextResponse.json({
      balance,
      totalRevenue,
      totalPayouts,
      history,
    });
  } catch (error) {
    console.error("Failed to fetch payout data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.user.id;
    const { amount, bankName, accountNumber, accountName } = await request.json();

    if (!amount || amount <= 0 || !bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Verify balance
    const revenueData = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(
        and(
          eq(orders.sellerId, sellerId),
          sql`${orders.status} IN ('paid', 'processed', 'shipping', 'completed')`
        )
      );

    const totalRevenue = Number(revenueData[0]?.total || 0);

    const payoutData = await db
      .select({ total: sum(payoutRequests.amount) })
      .from(payoutRequests)
      .where(
        and(
          eq(payoutRequests.sellerId, sellerId),
          sql`${payoutRequests.status} IN ('pending', 'completed')`
        )
      );

    const totalPayouts = Number(payoutData[0]?.total || 0);
    const balance = totalRevenue - totalPayouts;

    if (amount > balance) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const newRequest = await db.insert(payoutRequests).values({
      id: nanoid(),
      sellerId,
      amount,
      bankName,
      accountNumber,
      accountName,
      status: "pending",
    }).returning();

    return NextResponse.json(newRequest[0]);
  } catch (error) {
    console.error("Failed to create payout request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
