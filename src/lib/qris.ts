/**
 * QRIS Payment via Pakasir API
 * All API keys loaded from environment variables only.
 */

const PAKASIR_API_BASE = "https://api.pakasir.com/v1";
const USE_MOCK = process.env.QRIS_USE_MOCK === "true";

export interface QRISCreateParams {
  orderId: string;
  amount: number;
  description?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface QRISCreateResult {
  success: boolean;
  qrisId: string;
  qrisUrl: string;           // QR image URL or base64
  qrisString?: string;       // raw QRIS string
  expiredAt: string;
  amount: number;
}

export interface QRISWebhookPayload {
  order_id: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  amount: number;
  transaction_id: string;
  signature: string;
  paid_at?: string;
}

// ─── MOCK IMPLEMENTATION (for dev/demo) ──────────────────────────────────────
function generateMockQRIS(params: QRISCreateParams): QRISCreateResult {
  const qrisId = `mock_${params.orderId}_${Date.now()}`;
  const expiredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  // UPI-like mock QRIS string
  const qrisString = `00020101021226580014COM.PAKASIR.JBB0113${params.orderId}5204000053033605802ID5910JBB Pasar6007DESA63041234`;
  // Use QR code from a public API for demo
  const qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrisString)}`;
  return {
    success: true,
    qrisId,
    qrisUrl,
    qrisString,
    expiredAt,
    amount: params.amount,
  };
}

// ─── REAL PAKASIR IMPLEMENTATION ─────────────────────────────────────────────
async function createQRISReal(params: QRISCreateParams): Promise<QRISCreateResult> {
  const apiKey = process.env.QRIS_API_KEY;
  const projectSlug = process.env.QRIS_PROJECT_SLUG;

  if (!apiKey || !projectSlug) {
    throw new Error("QRIS_API_KEY dan QRIS_PROJECT_SLUG harus di-set di env");
  }

  const body = {
    project: projectSlug,
    order_id: params.orderId,
    amount: params.amount,
    description: params.description ?? `Order JBB #${params.orderId}`,
    customer_name: params.customerName ?? "Pelanggan JBB",
    customer_email: params.customerEmail ?? "pelanggan@jbb.desa",
    expired_in: 5, // 5 minutes
  };

  const res = await fetch(`${PAKASIR_API_BASE}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pakasir API error: ${res.status} - ${err}`);
  }

  const data = await res.json();

  return {
    success: true,
    qrisId: data.transaction_id ?? data.id,
    qrisUrl: data.qr_image_url ?? data.qris_url,
    qrisString: data.qris_string,
    expiredAt: data.expired_at ?? new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    amount: data.amount ?? params.amount,
  };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
export async function createQRIS(params: QRISCreateParams): Promise<QRISCreateResult> {
  if (USE_MOCK) {
    return generateMockQRIS(params);
  }
  return createQRISReal(params);
}

export function verifyWebhookSignature(
  payload: Omit<QRISWebhookPayload, "signature">,
  receivedSignature: string
): boolean {
  if (USE_MOCK) return true;

  const webhookSecret = process.env.QRIS_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  // Pakasir signature = HMAC-SHA256 of JSON payload
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return expected === receivedSignature;
}
