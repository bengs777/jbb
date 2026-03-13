/**
 * Local sandbox payment simulator.
 * Only active when MAYAR_USE_MOCK=true.
 *
 * GET  /api/payment/sandbox/[orderId]      -> show simulator UI
 * POST /api/payment/sandbox/[orderId]/pay  -> trigger fake "paid" webhook
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, topupTransactions, gameOrders } from "@/db/schema";
import { eq } from "drizzle-orm";

const USE_MOCK = process.env.MAYAR_USE_MOCK === "true";

// ─── Shared CSS ───────────────────────────────────────────────────────────────
const SHARED_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4ff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .card { background: #fff; border-radius: 1.5rem; box-shadow: 0 4px 32px rgba(0,0,0,.12); max-width: 420px; width: 100%; overflow: hidden; }
  .header { padding: 2rem 1.75rem 1.5rem; text-align: center; color: #fff; }
  .badge { display: inline-block; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.35); font-size: .65rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; padding: .3rem .9rem; border-radius: 999px; margin-bottom: .9rem; }
  .header h1 { font-size: 1.2rem; font-weight: 800; }
  .header .sub { font-size: .82rem; opacity: .75; margin-top: .3rem; }
  .amount { font-size: 2.2rem; font-weight: 900; margin-top: .6rem; letter-spacing: -.02em; }
  .body { padding: 1.5rem; }
  .info-row { display: flex; justify-content: space-between; align-items: center; font-size: .83rem; padding: .55rem 0; border-bottom: 1px solid #f1f5f9; }
  .info-row:last-child { border: none; }
  .lbl { color: #94a3b8; }
  .val { font-weight: 700; color: #1e293b; text-align: right; max-width: 60%; word-break: break-all; }
  /* Payment method grid */
  .methods-label { font-size: .75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .06em; margin: 1.25rem 0 .75rem; }
  .methods { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; margin-bottom: 1.25rem; }
  .method { border: 2px solid #e2e8f0; border-radius: .875rem; padding: .75rem .5rem; text-align: center; cursor: pointer; transition: all .15s; display: flex; flex-direction: column; align-items: center; gap: .35rem; }
  .method:hover { border-color: var(--accent, #6366f1); background: var(--accent-bg, #eef2ff); }
  .method.active { border-color: var(--accent, #6366f1); background: var(--accent-bg, #eef2ff); box-shadow: 0 0 0 3px var(--accent-ring, rgba(99,102,241,.15)); }
  .method .icon { font-size: 1.4rem; line-height: 1; }
  .method .name { font-size: .75rem; font-weight: 700; color: #475569; }
  .method.active .name { color: var(--accent, #6366f1); }
  /* Buttons */
  .btn { width: 100%; padding: 1rem; border: none; border-radius: .875rem; font-size: .95rem; font-weight: 800; cursor: pointer; transition: all .15s; margin-top: .6rem; }
  .btn-pay { background: var(--accent, #6366f1); color: #fff; }
  .btn-pay:hover:not(:disabled) { filter: brightness(1.1); }
  .btn-pay:disabled { opacity: .55; cursor: not-allowed; }
  .btn-cancel { background: #f1f5f9; color: #64748b; }
  .btn-cancel:hover { background: #e2e8f0; }
  /* Warning */
  .warning { background: #fefce8; border: 1px solid #fde68a; border-radius: .75rem; padding: .7rem 1rem; font-size: .73rem; color: #92400e; text-align: center; margin-bottom: 1.1rem; line-height: 1.5; }
  /* State screens */
  .state-screen { text-align: center; padding: 2rem 1rem; }
  .state-icon { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.1rem; font-size: 2rem; }
  .icon-success { background: #dcfce7; }
  .icon-error   { background: #fee2e2; }
  .icon-wait    { background: #fef9c3; }
  .state-title { font-size: 1.15rem; font-weight: 800; margin-bottom: .4rem; }
  .title-success { color: #15803d; }
  .title-error   { color: #dc2626; }
  .title-wait    { color: #b45309; }
  .state-desc { font-size: .83rem; color: #64748b; margin-bottom: 1.25rem; }
  /* Success overlay */
  #success-overlay { display: none; text-align: center; padding: 2rem 1rem; }
`;

// ─── Shared method picker HTML ────────────────────────────────────────────────
function methodPicker(accent = "#6366f1", accentBg = "#eef2ff", accentRing = "rgba(99,102,241,.15)") {
  return `
  <div class="methods-label">Pilih Metode Pembayaran</div>
  <div class="methods" id="methods">
    <div class="method active" onclick="pick(this)" data-m="QRIS">
      <span class="icon">&#x2BA1;</span><span class="name">QRIS</span>
    </div>
    <div class="method" onclick="pick(this)" data-m="Transfer Bank">
      <span class="icon">&#x1F3E6;</span><span class="name">Transfer Bank</span>
    </div>
    <div class="method" onclick="pick(this)" data-m="E-Wallet">
      <span class="icon">&#x1F4B3;</span><span class="name">E-Wallet</span>
    </div>
    <div class="method" onclick="pick(this)" data-m="Kartu">
      <span class="icon">&#x1F4B5;</span><span class="name">Kartu Debit/Kredit</span>
    </div>
  </div>`;
}

// ─── Shared script ────────────────────────────────────────────────────────────
function sharedScript(orderId: string, redirectUrl: string, btnLabel = "Bayar Sekarang") {
  return `
  <script>
    let selectedMethod = 'QRIS';
    function pick(el) {
      document.querySelectorAll('.method').forEach(m => m.classList.remove('active'));
      el.classList.add('active');
      selectedMethod = el.dataset.m;
    }
    async function simulatePay() {
      const btn = document.getElementById('pay-btn');
      btn.disabled = true;
      btn.textContent = 'Memproses ' + selectedMethod + '\\u2026';
      try {
        const res = await fetch('/api/payment/sandbox/${orderId}/pay', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ method: selectedMethod }) });
        const data = await res.json();
        if (data.ok) {
          document.getElementById('form-section').style.display = 'none';
          document.getElementById('success-overlay').style.display = 'block';
          setTimeout(() => window.location.href = '${redirectUrl}', 2200);
        } else {
          btn.disabled = false;
          btn.textContent = '${btnLabel}';
          alert('Gagal: ' + (data.error ?? 'Terjadi kesalahan'));
        }
      } catch(e) {
        btn.disabled = false;
        btn.textContent = '${btnLabel}';
        alert('Network error');
      }
    }
  <\/script>`;
}

// ─── Full page builder ────────────────────────────────────────────────────────
function buildPage(opts: {
  title: string;
  badge: string;
  headerGradient: string;
  headerIcon?: string;
  headerTitle: string;
  headerSub: string;
  amount: string;
  accentCss: string;
  state: "pending" | "success" | "failed";
  stateTitle?: string;
  stateDesc?: string;
  stateBtn?: string;
  stateBtnHref?: string;
  infoRows: { label: string; value: string }[];
  cancelHref: string;
  cancelLabel?: string;
  redirectUrl: string;
  btnLabel?: string;
  orderId: string;
}) {
  const { state, stateTitle, stateDesc, stateBtn, stateBtnHref, infoRows, cancelHref, cancelLabel, redirectUrl, btnLabel, orderId } = opts;

  const stateHtml = state !== "pending" ? `
    <div class="state-screen">
      <div class="state-icon ${state === "success" ? "icon-success" : "icon-error"}">${state === "success" ? "&#x2713;" : "&#x2715;"}</div>
      <p class="state-title ${state === "success" ? "title-success" : "title-error"}">${stateTitle ?? ""}</p>
      <p class="state-desc">${stateDesc ?? ""}</p>
      <button class="btn btn-cancel" onclick="window.location.href='${stateBtnHref ?? cancelHref}'">${stateBtn ?? "Kembali"}</button>
    </div>` : "";

  const formHtml = state === "pending" ? `
    <div class="warning">&#x26A0;&#xFE0F; Mode ini hanya untuk pengujian lokal &mdash; tidak ada transaksi nyata.</div>
    ${infoRows.map(r => `<div class="info-row"><span class="lbl">${r.label}</span><span class="val">${r.value}</span></div>`).join("")}
    ${methodPicker()}
    <button class="btn btn-pay" id="pay-btn" onclick="simulatePay()">${btnLabel ?? "Bayar Sekarang (Simulasi)"}</button>
    <button class="btn btn-cancel" onclick="window.location.href='${cancelHref}'">${cancelLabel ?? "Batal"}</button>
  ` : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${opts.title}</title>
  <style>${SHARED_CSS}${opts.accentCss}</style>
</head>
<body>
  <div class="card">
    <div class="header" style="background:${opts.headerGradient}">
      <div class="badge">${opts.badge}</div>
      <h1>${opts.headerIcon ?? ""}${opts.headerTitle}</h1>
      <p class="sub">${opts.headerSub}</p>
      <div class="amount">${opts.amount}</div>
    </div>
    <div class="body">
      <div id="form-section">
        ${state === "pending" ? formHtml : stateHtml}
      </div>
      <div id="success-overlay">
        <div class="state-icon icon-success" style="margin:1rem auto .75rem">&#x2713;</div>
        <p class="state-title title-success">Pembayaran Berhasil!</p>
        <p class="state-desc">Mengalihkan halaman&hellip;</p>
      </div>
    </div>
  </div>
  ${state === "pending" ? sharedScript(orderId, redirectUrl, btnLabel ?? "Bayar Sekarang (Simulasi)") : ""}
</body>
</html>`;
}

// ─── GET handler ──────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!USE_MOCK) {
    return new NextResponse("Sandbox tidak aktif", { status: 403 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();

  // ── Deposit / PPOB saldo ────────────────────────────────────────────────────
  const [topupTrx] = await db
    .select()
    .from(topupTransactions)
    .where(eq(topupTransactions.invoice_id, orderId))
    .limit(1);

  if (topupTrx) {
    const state = topupTrx.status === "SUCCESS" ? "success"
      : (topupTrx.status === "FAILED" || topupTrx.status === "REFUNDED") ? "failed"
      : "pending";

    const html = buildPage({
      title: "Mayar Sandbox — Isi Saldo PPOB",
      badge: "SANDBOX · DEPOSIT SALDO",
      headerGradient: "linear-gradient(135deg,#6366f1,#4f46e5)",
      headerTitle: "Mayar Payment",
      headerSub: "Top-Up Saldo / PPOB",
      amount: `Rp ${topupTrx.price.toLocaleString("id-ID")}`,
      accentCss: `:root{--accent:#6366f1;--accent-bg:#eef2ff;--accent-ring:rgba(99,102,241,.15)}`,
      state,
      stateTitle: state === "success" ? "Deposit Berhasil!" : "Deposit Gagal",
      stateDesc: state === "success" ? "Saldo sudah dikreditkan ke akunmu." : "Silakan coba isi saldo kembali.",
      stateBtn: state === "success" ? "Ke Halaman PPOB" : "Coba Lagi",
      stateBtnHref: state === "success" ? `${appUrl}/topup` : `${appUrl}/topup/deposit`,
      infoRows: [
        { label: "Jenis", value: "Deposit Saldo PPOB" },
        { label: "Invoice", value: orderId.slice(0, 22) + "…" },
        { label: "Jumlah", value: `Rp ${topupTrx.price.toLocaleString("id-ID")}` },
      ],
      cancelHref: `${appUrl}/topup/deposit`,
      cancelLabel: "Batal",
      redirectUrl: `${appUrl}/topup`,
      btnLabel: "Konfirmasi Deposit (Simulasi)",
      orderId,
    });

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  // ── Game Voucher ─────────────────────────────────────────────────────────────
  const [gameOrder] = await db
    .select()
    .from(gameOrders)
    .where(eq(gameOrders.invoice_id, orderId))
    .limit(1);

  if (gameOrder) {
    const state = gameOrder.status === "PAID" ? "success"
      : (gameOrder.status === "FAILED" || gameOrder.status === "EXPIRED") ? "failed"
      : "pending";

    const html = buildPage({
      title: "Mayar Sandbox — Game Voucher",
      badge: "SANDBOX · GAME VOUCHER",
      headerGradient: "linear-gradient(135deg,#7c3aed,#4f46e5)",
      headerIcon: "&#x1F3AE; ",
      headerTitle: gameOrder.game_name,
      headerSub: gameOrder.nominal_label,
      amount: `Rp ${gameOrder.amount.toLocaleString("id-ID")}`,
      accentCss: `:root{--accent:#7c3aed;--accent-bg:#f5f3ff;--accent-ring:rgba(124,58,237,.15)}`,
      state,
      stateTitle: state === "success" ? "Pembayaran Berhasil!" : "Order Gagal / Kedaluwarsa",
      stateDesc: state === "success" ? "Voucher sedang diproses untuk akunmu." : "Buat order baru dari halaman Games.",
      stateBtn: state === "success" ? "Lihat Status Order" : "Kembali ke Games",
      stateBtnHref: state === "success" ? `${appUrl}/games/status/${orderId}` : `${appUrl}/games`,
      infoRows: [
        { label: "Game", value: gameOrder.game_name },
        { label: "Nominal", value: gameOrder.nominal_label },
        { label: "User ID", value: gameOrder.target_user_id + (gameOrder.target_server_id ? `/${gameOrder.target_server_id}` : "") },
        { label: "Total", value: `Rp ${gameOrder.amount.toLocaleString("id-ID")}` },
      ],
      cancelHref: `${appUrl}/games`,
      cancelLabel: "Batal",
      redirectUrl: `${appUrl}/games/status/${orderId}`,
      btnLabel: "Bayar Sekarang (Simulasi)",
      orderId,
    });

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  // ── Marketplace Order ────────────────────────────────────────────────────────
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    return new NextResponse("Order tidak ditemukan", { status: 404 });
  }

  const state = order.status_pembayaran === "PAID" ? "success"
    : order.status_pembayaran === "EXPIRED" ? "failed"
    : "pending";

  const html = buildPage({
    title: "Mayar Sandbox — Simulasi Pembayaran",
    badge: "SANDBOX · JBB MARKETPLACE",
    headerGradient: "linear-gradient(135deg,#6366f1,#4f46e5)",
    headerTitle: "Mayar Payment",
    headerSub: `Order #${orderId.slice(0, 8).toUpperCase()}`,
    amount: `Rp ${order.total_bayar.toLocaleString("id-ID")}`,
    accentCss: `:root{--accent:#6366f1;--accent-bg:#eef2ff;--accent-ring:rgba(99,102,241,.15)}`,
    state,
    stateTitle: state === "success" ? "Order Sudah Dibayar" : "Order Kedaluwarsa",
    stateDesc: state === "success" ? "Transaksi sudah berhasil diproses." : "Waktu pembayaran habis. Buat order baru.",
    stateBtn: state === "success" ? "Lihat Pesanan" : "Kembali ke Katalog",
    stateBtnHref: state === "success" ? `${appUrl}/buyer/orders` : `${appUrl}/katalog`,
    infoRows: [
      { label: "Status", value: `<span style="color:#f59e0b;font-weight:700">Menunggu Bayar</span>` },
      { label: "Order ID", value: orderId.slice(0, 18) + "…" },
      { label: "Total", value: `Rp ${order.total_bayar.toLocaleString("id-ID")}` },
    ],
    cancelHref: `${appUrl}/buyer/cart`,
    cancelLabel: "Batal / Kembali ke Keranjang",
    redirectUrl: `${appUrl}/buyer/orders`,
    btnLabel: "Bayar Sekarang (Simulasi)",
    orderId,
  });

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
