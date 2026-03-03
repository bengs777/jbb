/**
 * Mayar.id Payment Gateway Integration
 * API: https://api.mayar.id/hl/v1  (production)
 *       https://api.mayar.club/hl/v1 (sandbox)
 *
 * Set MAYAR_USE_MOCK=true to skip real API calls (local / sandbox testing).
 */

const BASE_URL = (
  process.env.MAYAR_BASE_URL ?? "https://api.mayar.id/hl/v1"
).trim();

const API_KEY = (process.env.MAYAR_API_KEY ?? "").trim();
const WEBHOOK_TOKEN = (process.env.MAYAR_WEBHOOK_TOKEN ?? "").trim();
const USE_MOCK = process.env.MAYAR_USE_MOCK === "true";

// ─── Mock (sandbox / local) ───────────────────────────────────────────────────

function createMockPayment(params: MayarCreateParams): MayarCreateResult {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();
  const mockTxId = `mock_${params.orderId.slice(0, 8)}_${Date.now()}`;
  // Point to a local sandbox simulation page
  const paymentUrl = `${appUrl}/api/payment/sandbox/${params.orderId}`;
  const expiredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  console.log(`[mayar:mock] Payment link created for order ${params.orderId}: ${paymentUrl}`);
  return { success: true, paymentId: mockTxId, paymentUrl, expiredAt };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MayarCreateParams {
  orderId: string;
  amount: number;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  redirectUrl?: string;
}

export interface MayarCreateResult {
  success: boolean;
  paymentId: string;        // Mayar transaction_id
  paymentUrl: string;       // Hosted payment page URL
  expiredAt: string;
}

export interface MayarWebhookPayload {
  id: string;               // Mayar transaction id
  status: string;           // "paid" | "settlement" | "pending" | "expired" | "failed"
  amount: number;
  referenceId?: string;     // our orderId (if passed as referenceId)
  description?: string;
  email?: string;
  mobile?: string;
  paidAt?: string;
  createdAt?: string;
}

interface AnyRecord {
  [key: string]: unknown;
}

function asRecord(input: unknown): AnyRecord {
  return typeof input === "object" && input !== null ? (input as AnyRecord) : {};
}

function pickString(obj: AnyRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(obj: AnyRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

export function normalizeMayarWebhookPayload(raw: unknown): MayarWebhookPayload {
  const root = asRecord(raw);
  const nested = asRecord(root.data);
  const source: AnyRecord = Object.keys(nested).length > 0 ? { ...root, ...nested } : root;

  const id =
    pickString(source, ["id", "transaction_id", "transactionId", "payment_id", "paymentId"]) ??
    "";
  const status =
    pickString(source, ["status", "payment_status", "paymentStatus", "state"]) ??
    "pending";
  const amount = pickNumber(source, ["amount", "total", "total_amount", "totalAmount"]) ?? 0;

  return {
    id,
    status,
    amount,
    referenceId: pickString(source, ["referenceId", "reference_id", "invoice_id", "invoiceId"]),
    description: pickString(source, ["description", "note"]),
    email: pickString(source, ["email", "customer_email", "customerEmail"]),
    mobile: pickString(source, ["mobile", "phone", "customer_mobile", "customerMobile"]),
    paidAt: pickString(source, ["paidAt", "paid_at", "payment_date", "paymentDate"]),
    createdAt: pickString(source, ["createdAt", "created_at", "date", "createdDate"]),
  };
}

// ─── Create Payment ───────────────────────────────────────────────────────────

export async function createMayarPayment(
  params: MayarCreateParams
): Promise<MayarCreateResult> {
  if (USE_MOCK) return createMockPayment(params);

  if (!API_KEY) {
    throw new Error("MAYAR_API_KEY tidak di-set di environment");
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();
  const redirectUrl =
    params.redirectUrl ?? `${appUrl}/buyer/payment/${params.orderId}`;

  const body = {
    name: params.description ?? `Order JBB #${params.orderId.slice(0, 8).toUpperCase()}`,
    description: params.description ?? `Pembayaran order #${params.orderId}`,
    amount: params.amount,
    email: params.customerEmail ?? "pelanggan@jbb.com",
    mobile: params.customerMobile ?? "081234567890",
    redirectUrl,
    referenceId: params.orderId,   // sent back in webhook payload
    items: [
      {
        name: params.description ?? `Order JBB #${params.orderId.slice(0, 8).toUpperCase()}`,
        description: `Pembayaran order #${params.orderId.slice(0, 8).toUpperCase()}`,
        quantity: 1,
        rate: params.amount,
      },
    ],
  };

  const res = await fetch(`${BASE_URL}/invoice/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || data.statusCode !== 200) {
    const msg =
      Array.isArray(data.data)
        ? data.data.map((e: any) => e.message).join(", ")
        : data.messages ?? "Unknown error";
    throw new Error(`Mayar API error ${res.status}: ${msg}`);
  }

  const txId: string = data.data.transaction_id ?? data.data.transactionId ?? data.data.id;
  const link: string = data.data.link;

  // Mayar payment links don't expire by default — we use our own 5-minute window
  const expiredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return {
    success: true,
    paymentId: txId,
    paymentUrl: link,
    expiredAt,
  };
}

// ─── Webhook Verification ─────────────────────────────────────────────────────

/**
 * Verify incoming Mayar webhook by comparing x-callback-token header.
 */
export function verifyMayarWebhook(
  headers: Headers | Record<string, string>
): boolean {
  // Skip in development if no token configured
  if (!WEBHOOK_TOKEN) {
    console.warn("[mayar] MAYAR_WEBHOOK_TOKEN not set — skipping webhook verification");
    return true;
  }

  const getHeader = (name: string) =>
    typeof (headers as Headers).get === "function"
      ? (headers as Headers).get(name)
      : (headers as Record<string, string>)[name];

  const token =
    getHeader("x-callback-token") ??
    getHeader("x-callback-signature") ??
    getHeader("x-mayar-token") ??
    getHeader("x-mayar-signature");

  return token === WEBHOOK_TOKEN;
}

// ─── Status normalizer ────────────────────────────────────────────────────────

/**
 * Normalize Mayar payment status to internal status.
 * Mayar statuses: paid, settlement, pending, expired, failed, cancelled
 */
export function normalizeMayarStatus(
  status: string
): "PAID" | "UNPAID" | "EXPIRED" | "FAILED" {
  const s = status.toLowerCase();
  if (s === "paid" || s === "settlement" || s === "completed") return "PAID";
  if (s === "failed" || s === "failure" || s === "error") return "FAILED";
  if (s === "expired" || s === "cancelled") return "EXPIRED";
  return "UNPAID";
}
