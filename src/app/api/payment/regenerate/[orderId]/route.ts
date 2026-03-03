import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { createMayarPayment } from "@/lib/mayar";
import { isExpired } from "@/lib/utils";

const USE_MOCK = process.env.MAYAR_USE_MOCK === "true";

// POST /api/payment/regenerate/[orderId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const guard = requireAuth(req);
  if ("status" in guard) return guard;
  const { user } = guard;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return err("Order tidak ditemukan", 404);

  if (order.buyer_id !== user.id && user.role !== "ADMIN") {
    return err("Akses ditolak", 403);
  }

  if (order.status_pembayaran === "PAID") {
    return err("Order sudah dibayar", 400);
  }

  // For EXPIRED orders, reset to UNPAID so user can pay again
  const isExpiredOrder = order.status_pembayaran === "EXPIRED" || isExpired(order.expired_at);
  if (!USE_MOCK && isExpiredOrder) {
    await db
      .update(orders)
      .set({ status_pembayaran: "UNPAID", updated_at: new Date().toISOString() })
      .where(eq(orders.id, orderId));
  }

  try {
    const [buyerRow] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, order.buyer_id));

    const mayar = await createMayarPayment({
      orderId,
      amount: order.total_bayar,
      description: `JBB Order #${orderId.slice(0, 8).toUpperCase()}`,
      customerName: buyerRow?.name,
      customerEmail: buyerRow?.email,
    });

    await db
      .update(orders)
      .set({
        qris_url: mayar.paymentUrl,
        qris_id: mayar.paymentId,
        expired_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // extend 30 min
        updated_at: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId));

    return ok({ payment_url: mayar.paymentUrl });
  } catch (e: any) {
    console.error("[regenerate payment]", e);
    return err("Gagal membuat link pembayaran: " + e.message, 500);
  }
}
