import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { topupTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await params;

  const [trx] = await db
    .select()
    .from(topupTransactions)
    .where(eq(topupTransactions.invoice_id, invoiceId))
    .limit(1);

  if (!trx) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the owner can view their order
  if (trx.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      invoiceId: trx.invoice_id,
      status: trx.status,
      productCode: trx.product_code,
      productName: null,
      targetNumber: trx.target_number,
      price: trx.price,
      mayarPaymentUrl: trx.mayar_payment_url,
      mayarPaidAt: trx.mayar_paid_at,
      sn: trx.portalpulsa_sn,
      failureReason: trx.failure_reason,
      createdAt: trx.created_at,
      updatedAt: trx.updated_at,
    },
  });
}
