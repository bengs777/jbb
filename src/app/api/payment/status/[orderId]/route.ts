import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { isExpired } from "@/lib/utils";

const USE_MOCK = process.env.MAYAR_USE_MOCK === "true";

// GET /api/payment/status/[orderId] - Poll payment status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const guard = requireAuth(req);
  if ("status" in guard) return guard;

  try {
    const [order] = await db
      .select({
        id: orders.id,
        status_pembayaran: orders.status_pembayaran,
        expired_at: orders.expired_at,
        qris_url: orders.qris_url,
      })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) return err("Order tidak ditemukan", 404);

    // Auto-expire check on status poll (skip in mock mode for testing old orders)
    if (
      !USE_MOCK &&
      order.status_pembayaran === "UNPAID" &&
      isExpired(order.expired_at)
    ) {
      const now = new Date().toISOString();
      await db
        .update(orders)
        .set({ status_pembayaran: "EXPIRED", updated_at: now })
        .where(eq(orders.id, orderId));

      return ok({
        status: "EXPIRED",
        expired_at: order.expired_at,
        payment_url: null,
      });
    }

    return ok({
      status: order.status_pembayaran,
      expired_at: order.expired_at,
      // Strip stale sandbox URLs when not in mock mode
      payment_url:
        !USE_MOCK && order.qris_url?.includes("/api/payment/sandbox")
          ? null
          : order.qris_url,
    });
  } catch (e) {
    console.error("[GET /api/payment/status]", e);
    return err("Gagal cek status pembayaran", 500);
  }
}
