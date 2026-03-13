/**
 * PortalPulsa.com API Integration
 * Docs: https://portalpulsa.com/api
 *
 * Auth: HMAC-MD5 signature
 *   sign = MD5( member_id + api_key + target_number )  — untuk order
 *   sign = MD5( member_id + api_key )                  — untuk cek saldo/produk
 *
 * Set PORTALPULSA_MOCK=true untuk bypass real API (dev/staging).
 */

import { createHash } from "crypto";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL =
  (process.env.PORTALPULSA_BASE_URL ?? "https://portalpulsa.com/api/v2").trim();
const MEMBER_ID = (process.env.PORTALPULSA_MEMBER_ID ?? "").trim();
const API_KEY = (process.env.PORTALPULSA_API_KEY ?? "").trim();
const USE_MOCK = process.env.PORTALPULSA_MOCK === "true";

// Markup margin — 2.5% sesuai permintaan terbaru
export const TOPUP_MARGIN = 0.025;

// ─── Signature Helper ─────────────────────────────────────────────────────────

/** Signature untuk order: MD5(member_id + api_key + target_number) */
export function signOrder(targetNumber: string): string {
  return createHash("md5")
    .update(MEMBER_ID + API_KEY + targetNumber)
    .digest("hex");
}

/** Signature generik: MD5(member_id + api_key) */
export function signGeneral(): string {
  return createHash("md5").update(MEMBER_ID + API_KEY).digest("hex");
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PPProduct {
  code: string;
  name: string;
  category: string; // "pulsa" | "data" | "pln" | "ewallet"
  operator: string;
  price: number;    // harga modal
  status: string;   // "available" | "empty"
}

export interface PPOrderRequest {
  invoiceId: string;     // referensi order kita (idempotency)
  productCode: string;
  targetNumber: string;
}

export interface PPOrderResponse {
  success: boolean;
  trxId?: string;         // ID transaksi PP
  sn?: string;            // Serial Number (token PLN dll)
  rc: string;             // response code: "00" = sukses
  message: string;
  status: "pending" | "success" | "failed";
}

export interface PPStatusResponse {
  trxId: string;
  rc: string;
  sn?: string;
  message: string;
  status: "pending" | "success" | "failed";
}

// ─── Mock Implementations ─────────────────────────────────────────────────────

function mockGetProducts(): PPProduct[] {
  return [
    // ── Pulsa ────────────────────────────────────────────────────────────────
    { code: "TLKM5",   name: "Telkomsel 5.000",   category: "pulsa", operator: "Telkomsel", price: 6000,  status: "available" },
    { code: "TLKM10",  name: "Telkomsel 10.000",  category: "pulsa", operator: "Telkomsel", price: 11500, status: "available" },
    { code: "TLKM20",  name: "Telkomsel 20.000",  category: "pulsa", operator: "Telkomsel", price: 21500, status: "available" },
    { code: "TLKM50",  name: "Telkomsel 50.000",  category: "pulsa", operator: "Telkomsel", price: 52000, status: "available" },
    { code: "TLKM100", name: "Telkomsel 100.000", category: "pulsa", operator: "Telkomsel", price: 102000,status: "available" },
    { code: "XL5",     name: "XL 5.000",          category: "pulsa", operator: "XL",        price: 5500,  status: "available" },
    { code: "XL10",    name: "XL 10.000",         category: "pulsa", operator: "XL",        price: 11000, status: "available" },
    { code: "XL20",    name: "XL 20.000",         category: "pulsa", operator: "XL",        price: 21000, status: "available" },
    { code: "XL50",    name: "XL 50.000",         category: "pulsa", operator: "XL",        price: 51000, status: "available" },
    { code: "ISAT10",  name: "Indosat 10.000",    category: "pulsa", operator: "Indosat",   price: 11000, status: "available" },
    { code: "ISAT25",  name: "Indosat 25.000",    category: "pulsa", operator: "Indosat",   price: 26000, status: "available" },
    { code: "ISAT50",  name: "Indosat 50.000",    category: "pulsa", operator: "Indosat",   price: 51500, status: "available" },
    { code: "THREE10", name: "Three 10.000",       category: "pulsa", operator: "Three",     price: 10500, status: "available" },
    { code: "THREE25", name: "Three 25.000",       category: "pulsa", operator: "Three",     price: 25500, status: "available" },
    { code: "AXIS10",  name: "Axis 10.000",        category: "pulsa", operator: "Axis",      price: 10500, status: "available" },
    { code: "AXIS25",  name: "Axis 25.000",        category: "pulsa", operator: "Axis",      price: 25500, status: "available" },
    // ── Paket Data ───────────────────────────────────────────────────────────
    { code: "TLKM-D1G",  name: "Telkomsel 1GB/7hr",   category: "data", operator: "Telkomsel", price: 15000, status: "available" },
    { code: "TLKM-D5G",  name: "Telkomsel 5GB/30hr",  category: "data", operator: "Telkomsel", price: 58000, status: "available" },
    { code: "TLKM-D10G", name: "Telkomsel 10GB/30hr", category: "data", operator: "Telkomsel", price: 95000, status: "available" },
    { code: "XL-D2G",    name: "XL 2GB/30hr",         category: "data", operator: "XL",        price: 25000, status: "available" },
    { code: "XL-D8G",    name: "XL 8GB/30hr",         category: "data", operator: "XL",        price: 65000, status: "available" },
    { code: "ISAT-D3G",  name: "Indosat 3GB/30hr",    category: "data", operator: "Indosat",   price: 32000, status: "available" },
    { code: "ISAT-D10G", name: "Indosat 10GB/30hr",   category: "data", operator: "Indosat",   price: 80000, status: "available" },
    { code: "THREE-D2G", name: "Three 2GB/30hr",       category: "data", operator: "Three",     price: 18000, status: "available" },
    { code: "THREE-D8G", name: "Three 8GB/30hr",       category: "data", operator: "Three",     price: 60000, status: "available" },
    // ── PLN Token ────────────────────────────────────────────────────────────
    { code: "PLN20",   name: "PLN Token 20.000",   category: "pln", operator: "PLN", price: 21500,  status: "available" },
    { code: "PLN50",   name: "PLN Token 50.000",   category: "pln", operator: "PLN", price: 52000,  status: "available" },
    { code: "PLN100",  name: "PLN Token 100.000",  category: "pln", operator: "PLN", price: 103000, status: "available" },
    { code: "PLN200",  name: "PLN Token 200.000",  category: "pln", operator: "PLN", price: 205000, status: "available" },
    { code: "PLN500",  name: "PLN Token 500.000",  category: "pln", operator: "PLN", price: 510000, status: "available" },
    { code: "PLN1000", name: "PLN Token 1.000.000",category: "pln", operator: "PLN", price: 1015000,status: "available" },
    // ── E-Wallet ─────────────────────────────────────────────────────────────
    { code: "OVO20",     name: "OVO 20.000",      category: "ewallet", operator: "OVO",    price: 21000, status: "available" },
    { code: "OVO50",     name: "OVO 50.000",      category: "ewallet", operator: "OVO",    price: 52000, status: "available" },
    { code: "OVO100",    name: "OVO 100.000",     category: "ewallet", operator: "OVO",    price: 103000,status: "available" },
    { code: "GOPAY20",   name: "GoPay 20.000",    category: "ewallet", operator: "GoPay",  price: 21000, status: "available" },
    { code: "GOPAY50",   name: "GoPay 50.000",    category: "ewallet", operator: "GoPay",  price: 52000, status: "available" },
    { code: "GOPAY100",  name: "GoPay 100.000",   category: "ewallet", operator: "GoPay",  price: 103000,status: "available" },
    { code: "DANA20",    name: "DANA 20.000",     category: "ewallet", operator: "DANA",   price: 21000, status: "available" },
    { code: "DANA50",    name: "DANA 50.000",     category: "ewallet", operator: "DANA",   price: 52000, status: "available" },
    { code: "DANA100",   name: "DANA 100.000",    category: "ewallet", operator: "DANA",   price: 103000,status: "available" },
    { code: "SHOPEE50",  name: "ShopeePay 50.000",category: "ewallet", operator: "ShopeePay",price: 52500,status: "available" },
    { code: "SHOPEE100", name: "ShopeePay 100.000",category: "ewallet",operator: "ShopeePay",price: 104000,status: "available" },
    // ── TV Kabel ─────────────────────────────────────────────────────────────
    { code: "INDVISION1", name: "Indovision 1 Bulan",  category: "tv", operator: "Indovision", price: 130000, status: "available" },
    { code: "INDVISION3", name: "Indovision 3 Bulan",  category: "tv", operator: "Indovision", price: 375000, status: "available" },
    { code: "MNC1",       name: "MNC Vision 1 Bulan",  category: "tv", operator: "MNC Vision", price: 110000, status: "available" },
    { code: "TRANSVISI1", name: "TransVision 1 Bulan", category: "tv", operator: "TransVision",price: 149000, status: "available" },
    // ── Telepon (PSTN) ────────────────────────────────────────────────────────
    { code: "TELKOM50",  name: "Telkom Pay 50.000",  category: "telpon", operator: "Telkom", price: 52000, status: "available" },
    { code: "TELKOM100", name: "Telkom Pay 100.000", category: "telpon", operator: "Telkom", price: 103000,status: "available" },
    // ── PDAM ──────────────────────────────────────────────────────────────────
    { code: "PDAM50",  name: "PDAM 50.000",  category: "pdam", operator: "PDAM", price: 52000, status: "available" },
    { code: "PDAM100", name: "PDAM 100.000", category: "pdam", operator: "PDAM", price: 103000,status: "available" },
    { code: "PDAM200", name: "PDAM 200.000", category: "pdam", operator: "PDAM", price: 205000,status: "available" },
    // ── BPJS ─────────────────────────────────────────────────────────────────
    { code: "BPJS50",  name: "BPJS 1 Jiwa",  category: "bpjs", operator: "BPJS", price: 42000, status: "available" },
    { code: "BPJS150", name: "BPJS 3 Jiwa",  category: "bpjs", operator: "BPJS", price: 126000,status: "available" },
    { code: "BPJS250", name: "BPJS 5 Jiwa",  category: "bpjs", operator: "BPJS", price: 210000,status: "available" },
  ];
}

function mockCreateOrder(req: PPOrderRequest): PPOrderResponse {
  console.log("[portalpulsa:mock] order created", req);
  return {
    success: true,
    trxId: `mock_pp_${Date.now()}`,
    rc: "00",
    message: "Transaksi berhasil diproses (mock)",
    status: "pending",
  };
}

function mockCheckStatus(trxId: string): PPStatusResponse {
  console.log("[portalpulsa:mock] check status", trxId);
  return {
    trxId,
    rc: "00",
    sn: `SN-MOCK-${trxId.slice(-6)}`,
    message: "Sukses (mock)",
    status: "success",
  };
}

// ─── Fetch helper with retry ──────────────────────────────────────────────────

async function ppFetch<T>(
  endpoint: string,
  params: Record<string, string>,
  retries = 3,
  timeoutMs = 15_000
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  // PortalPulsa menggunakan GET dengan query params
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("member_id", MEMBER_ID);

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      if (json.rc === "06") {
        // Kode 06 = transaksi sedang diproses, bukan error — return langsung
        return json as T;
      }

      return json as T;
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[portalpulsa] attempt ${attempt}/${retries} failed: ${lastError.message}`
      );
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      }
    }
  }

  throw lastError;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Ambil daftar produk dari PortalPulsa.
 * Digunakan oleh cron job untuk sinkronisasi cache produk.
 */
export async function getProducts(): Promise<PPProduct[]> {
  if (USE_MOCK) return mockGetProducts();

  assertCredentials();

  const sign = signGeneral();
  const raw = await ppFetch<{
    data?: Array<{
      code: string;
      name: string;
      type?: string;
      category?: string;
      operator?: string;
      price: number;
      status: string;
    }>;
  }>("/products", { api_key: API_KEY, sign });

  return (raw.data ?? []).map((p) => ({
    code: p.code,
    name: p.name,
    category: normalizeCategory(p.category ?? p.type ?? ""),
    operator: p.operator ?? "",
    price: p.price,
    status: p.status === "available" ? "available" : "empty",
  }));
}

/**
 * Kirim order ke PortalPulsa.
 * IDEMPOTENT: gunakan invoiceId yang sama jika retry — PP akan mengembalikan trxId yang sama.
 */
export async function createOrder(
  req: PPOrderRequest
): Promise<PPOrderResponse> {
  if (USE_MOCK) return mockCreateOrder(req);

  assertCredentials();

  const sign = signOrder(req.targetNumber);
  const raw = await ppFetch<{
    rc: string;
    trx_id?: string;
    sn?: string;
    message?: string;
  }>("/order", {
    api_key: API_KEY,
    sign,
    invoice_id: req.invoiceId,
    code: req.productCode,
    target: req.targetNumber,
  });

  const rc = raw.rc ?? "99";
  const status = rcToStatus(rc);

  return {
    success: status !== "failed",
    trxId: raw.trx_id,
    sn: raw.sn,
    rc,
    message: raw.message ?? rcMessage(rc),
    status,
  };
}

/**
 * Cek status transaksi yang sudah ada di PP.
 * Dipanggil oleh webhook handler atau cron untuk transaksi pending.
 */
export async function checkOrderStatus(
  trxId: string
): Promise<PPStatusResponse> {
  if (USE_MOCK) return mockCheckStatus(trxId);

  assertCredentials();

  const sign = signGeneral();
  const raw = await ppFetch<{
    rc: string;
    trx_id?: string;
    sn?: string;
    message?: string;
  }>("/status", { api_key: API_KEY, sign, trx_id: trxId });

  return {
    trxId: raw.trx_id ?? trxId,
    rc: raw.rc ?? "99",
    sn: raw.sn,
    message: raw.message ?? rcMessage(raw.rc ?? "99"),
    status: rcToStatus(raw.rc ?? "99"),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertCredentials() {
  if (!MEMBER_ID || !API_KEY) {
    throw new Error(
      "PORTALPULSA_MEMBER_ID dan PORTALPULSA_API_KEY wajib di-set di environment"
    );
  }
}

function normalizeCategory(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes("pulsa")) return "pulsa";
  if (r.includes("data") || r.includes("paket")) return "data";
  if (r.includes("pln") || r.includes("token")) return "pln";
  if (r.includes("ewallet") || r.includes("wallet") || r.includes("ovo") || r.includes("gopay") || r.includes("dana")) return "ewallet";
  return r || "other";
}

/** Mapping PortalPulsa rc (response code) ke internal status */
function rcToStatus(rc: string): "pending" | "success" | "failed" {
  if (rc === "00") return "success";
  if (rc === "06") return "pending"; // sedang diproses oleh operator
  return "failed";
}

function rcMessage(rc: string): string {
  const messages: Record<string, string> = {
    "00": "Transaksi berhasil",
    "01": "Stok kosong",
    "02": "Nominal tidak tersedia",
    "03": "Nomor tidak valid",
    "04": "Member tidak aktif",
    "05": "Saldo kurang",
    "06": "Transaksi sedang diproses",
    "07": "Gagal — coba lagi",
    "08": "Invoice ID duplikat",
    "99": "Kesalahan tidak diketahui",
  };
  return messages[rc] ?? `Error code: ${rc}`;
}

/**
 * Hitung harga jual dari harga modal dengan markup 5%.
 */
export function calculateSellPrice(cost: number): number {
  return Math.ceil(cost * (1 + TOPUP_MARGIN));
}

/**
 * Hitung profit dari selisih harga jual dan modal.
 */
export function calculateProfit(price: number, cost: number): number {
  return price - cost;
}
