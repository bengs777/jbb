/* ============================================================
   PPOB Category Page — /topup/[category]
   Handles: pulsa | data | pln | ewallet | tv | telpon | pdam | bpjs
   ============================================================ */
"use client";

import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  ArrowLeft, RefreshCw, ChevronRight, CircleCheck, Wallet,
  Smartphone, Wifi, Zap, Tv, Phone, Droplets, ShieldCheck,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

// ─── Meta per kategori ────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, {
  label: string;
  inputLabel: string;
  inputPlaceholder: string;
  gradient: string;
  icon: React.ElementType;
}> = {
  pulsa:   { label: "Pulsa",        inputLabel: "Nomor HP",           inputPlaceholder: "Contoh: 08123456789",   icon: Smartphone, gradient: "from-blue-600 to-blue-700" },
  data:    { label: "Paket Data",   inputLabel: "Nomor HP",           inputPlaceholder: "Contoh: 08123456789",   icon: Wifi,       gradient: "from-violet-600 to-purple-700" },
  pln:     { label: "Token PLN",    inputLabel: "ID Pelanggan PLN",   inputPlaceholder: "Contoh: 123456789012",  icon: Zap,        gradient: "from-amber-500 to-yellow-600" },
  ewallet: { label: "E-Wallet",     inputLabel: "Nomor HP / ID",      inputPlaceholder: "Nomor akun e-wallet",   icon: Wallet,     gradient: "from-pink-500 to-rose-600" },
  tv:      { label: "TV Kabel",     inputLabel: "ID Pelanggan",       inputPlaceholder: "Nomor ID pelanggan",    icon: Tv,         gradient: "from-sky-500 to-cyan-600" },
  telpon:  { label: "Telepon",      inputLabel: "Nomor Telepon",      inputPlaceholder: "Contoh: 02112345678",   icon: Phone,      gradient: "from-emerald-500 to-green-700" },
  pdam:    { label: "PDAM",         inputLabel: "ID Pelanggan PDAM",  inputPlaceholder: "Nomor ID PDAM",         icon: Droplets,   gradient: "from-teal-500 to-cyan-700" },
  bpjs:    { label: "BPJS",         inputLabel: "No. Virtual Account",inputPlaceholder: "Nomor VA BPJS",         icon: ShieldCheck,gradient: "from-red-500 to-rose-700" },
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = (params?.category as string) ?? "pulsa";
  const meta = CATEGORY_META[category] ?? CATEGORY_META.pulsa;
  const Icon = meta.icon;

  const [balance, setBalance]           = useState<number | null>(null);
  const [products, setProducts]         = useState<any[]>([]);
  const [operators, setOperators]       = useState<string[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [targetNumber, setTargetNumber] = useState("");
  const [selectedProduct, setSelectedProduct]   = useState<any | null>(null);
  const [loading, setLoading]           = useState(true);
  const [ordering, setOrdering]         = useState(false);
  const [error, setError]               = useState("");
  const [result, setResult]             = useState<any | null>(null);
  const [payMethod, setPayMethod]       = useState<"wallet" | "direct">("direct");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        fetch("/api/topup/balance"),
        fetch(`/api/topup/products?category=${category}`),
      ]);
      const [bJson, pJson] = await Promise.all([bRes.json(), pRes.json()]);
      if (bJson.success) setBalance(bJson.data.balance);
      const prods: any[] = pJson.data ?? [];
      setProducts(prods);
      const ops = Array.from(new Set(prods.map((p: any) => p.operator))).filter(Boolean) as string[];
      setOperators(ops);
      if (ops.length === 1) setSelectedOperator(ops[0]);
    } catch {}
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = selectedOperator
    ? products.filter((p) => p.operator === selectedOperator)
    : products;

  const handleOrder = async () => {
    setError("");
    if (!targetNumber.trim()) return setError(`Masukkan ${meta.inputLabel}`);
    if (!selectedProduct)     return setError("Pilih nominal terlebih dahulu");
    setOrdering(true);
    try {
      const res = await fetch("/api/topup/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: selectedProduct.code,
          targetNumber: targetNumber.trim(),
          payWithBalance: payMethod === "wallet",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Gagal melakukan order");
      } else if (json.data.paymentUrl) {
        // Direct payment — redirect user to Mayar payment page
        window.location.href = json.data.paymentUrl;
      } else {
        setResult(json.data);
        fetchData(); // refresh balance
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    }
    setOrdering(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${meta.gradient} text-white`}>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-20">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-5 transition"
          >
            <ArrowLeft size={16} /> Kembali
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Icon size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black">{meta.label}</h1>
              <p className="text-white/60 text-xs">via PortalPulsa.com</p>
            </div>
          </div>

          {balance !== null && (
            <div className="mt-4 bg-white/15 rounded-xl px-4 py-2 inline-flex items-center gap-2">
              <Wallet size={13} className="text-white/70" />
              <span className="text-sm font-semibold text-white">
                Saldo: {formatRupiah(balance)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-16 space-y-4">

        {/* ── Hasil Transaksi ─────────────────────────────────────────── */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CircleCheck size={20} className="text-green-600" />
              <p className="font-black text-green-800">
                {result.status === "SUCCESS" ? "Transaksi Berhasil!" : "Sedang Diproses"}
              </p>
            </div>
            <p className="text-sm text-green-700">{result.message}</p>
            {result.sn && (
              <p className="font-mono text-xs bg-green-100 text-green-700 rounded-lg px-3 py-1.5 mt-2">
                SN: {result.sn}
              </p>
            )}
            <p className="text-xs text-green-500 mt-2">Invoice: {result.invoiceId}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setResult(null); setSelectedProduct(null); setTargetNumber(""); }}
                className="flex-1 border-2 border-green-300 text-green-700 font-bold text-sm py-2.5 rounded-xl hover:bg-green-100 transition"
              >
                Transaksi Lagi
              </button>
              <Link
                href="/topup/history"
                className="flex-1 bg-green-600 text-white font-bold text-sm py-2.5 rounded-xl text-center hover:bg-green-700 transition"
              >
                Lihat Riwayat
              </Link>
            </div>
          </div>
        )}

        {!result && (
          <>
            {/* ── Metode Pembayaran ───────────────────────────────── */}
            <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-5">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Metode Pembayaran</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPayMethod("direct")}
                  className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 transition text-left ${
                    payMethod === "direct"
                      ? "border-primary bg-primary/10"
                      : "border-gray-100 bg-gray-50 hover:border-primary/20"
                  }`}
                >
                  <CreditCard size={18} className={payMethod === "direct" ? "text-primary" : "text-gray-400"} />
                  <div>
                    <p className={`text-xs font-bold ${payMethod === "direct" ? "text-primary" : "text-gray-700"}`}>Bayar Langsung</p>
                    <p className="text-[10px] text-gray-400">Transfer / QRIS</p>
                  </div>
                </button>
                <button
                  onClick={() => setPayMethod("wallet")}
                  className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 transition text-left ${
                    payMethod === "wallet"
                      ? "border-primary bg-primary/10"
                      : "border-gray-100 bg-gray-50 hover:border-primary/20"
                  }`}
                >
                  <Wallet size={18} className={payMethod === "wallet" ? "text-primary" : "text-gray-400"} />
                  <div>
                    <p className={`text-xs font-bold ${payMethod === "wallet" ? "text-primary" : "text-gray-700"}`}>Saldo</p>
                    <p className="text-[10px] text-gray-400">{balance !== null ? formatRupiah(balance) : "—"}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Operator / Brand Tabs ────────────────────────────── */}
            {operators.length > 1 && (
              <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-5">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">
                  Pilih Operator / Brand
                </p>
                {loading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-20 bg-gray-100 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setSelectedOperator(null); setSelectedProduct(null); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition ${
                        !selectedOperator
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:border-primary/30"
                      }`}
                    >
                      Semua
                    </button>
                    {operators.map((op) => (
                      <button
                        key={op}
                        onClick={() => { setSelectedOperator(selectedOperator === op ? null : op); setSelectedProduct(null); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition ${
                          selectedOperator === op
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-primary/30"
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Input Nomor / ID ──────────────────────── */}
            <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                {meta.inputLabel}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={meta.inputPlaceholder}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base font-semibold text-gray-800
                           focus:outline-none focus:border-primary transition placeholder:font-normal placeholder:text-gray-300"
              />
            </div>

            {/* ── Daftar Produk ─────────────────────────── */}
            <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Pilih Nominal</p>
                {!loading && <span className="text-xs text-gray-300">{filtered.length} produk</span>}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400">Produk tidak tersedia</p>
                  <button onClick={fetchData} className="mt-3 text-xs text-primary flex items-center gap-1 mx-auto hover:underline">
                    <RefreshCw size={11} /> Muat ulang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filtered.map((p) => {
                    const active    = selectedProduct?.code === p.code;
                    const canAfford = payMethod === "direct" || (balance !== null && balance >= p.price);
                    return (
                      <button
                        key={p.code}
                        disabled={!canAfford}
                        onClick={() => setSelectedProduct(active ? null : p)}
                        className={`relative text-left p-3.5 rounded-2xl border-2 transition
                          ${active ? "border-primary bg-primary/10 shadow-md shadow-primary/20" : "border-gray-100 bg-gray-50 hover:border-primary/30 hover:bg-primary/5"}
                          ${!canAfford ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {active && (
                          <CircleCheck size={14} className="absolute top-2.5 right-2.5 text-primary" />
                        )}
                        <p className="text-[11px] text-gray-400 font-medium">{p.operator}</p>
                        <p className="text-sm font-bold text-gray-800 leading-tight mt-0.5">{p.name}</p>
                        <p className={`text-sm font-black mt-2 ${active ? "text-primary" : "text-gray-700"}`}>
                          {formatRupiah(p.price)}
                        </p>
                        {payMethod === "wallet" && !canAfford && (
                          <p className="text-[10px] text-red-400 mt-0.5 font-medium">Saldo kurang</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Order Summary ──────────────────────────── */}
            {selectedProduct && targetNumber && (
              <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-5">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-4">
                  Ringkasan Pesanan
                </p>
                <div className="space-y-2.5 text-sm">
                  {([
                    ["Produk",       selectedProduct.name],
                    ["Nomor Tujuan", targetNumber],
                    ["Operator",     selectedProduct.operator],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-400">{k}</span>
                      <span className="font-semibold text-gray-800 font-mono text-right max-w-[55%] truncate">{v}</span>
                    </div>
                  ))}
                  <hr className="border-dashed" />
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-600">Total Bayar</span>
                    <span className="text-primary text-base">{formatRupiah(selectedProduct.price)}</span>
                  </div>
                  {payMethod === "wallet" && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Saldo setelah transaksi</span>
                      <span>{balance !== null ? formatRupiah(Math.max(0, balance - selectedProduct.price)) : "—"}</span>
                    </div>
                  )}
                  {payMethod === "direct" && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Metode</span>
                      <span className="font-semibold text-primary">Transfer / QRIS</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium">
                ⚠ {error}
              </div>
            )}

            {/* Saldo kurang (wallet mode only) */}
            {payMethod === "wallet" && balance !== null && selectedProduct && balance < selectedProduct.price && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-amber-800 font-bold">Saldo tidak mencukupi</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Butuh {formatRupiah(selectedProduct.price - balance)} lagi
                  </p>
                </div>
                <Link
                  href="/topup/deposit"
                  className="shrink-0 text-xs bg-amber-500 text-white font-bold px-3 py-2 rounded-xl hover:bg-amber-600 transition"
                >
                  + Isi Saldo
                </Link>
              </div>
            )}

            {/* Order Button */}
            <button
              onClick={handleOrder}
              disabled={
                !selectedProduct || !targetNumber.trim() || ordering ||
                (payMethod === "wallet" && balance !== null && balance < (selectedProduct?.price ?? 0))
              }
              className="w-full bg-primary text-white font-black py-4 rounded-2xl
                         hover:bg-primary-hover active:scale-[0.98]
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition flex items-center justify-center gap-2
                         shadow-lg shadow-primary/20 text-[15px]"
            >
              {ordering ? (
                <><RefreshCw size={16} className="animate-spin" /> Memproses...</>
              ) : payMethod === "direct" ? (
                <><CreditCard size={16} /> Bayar Sekarang <ChevronRight size={16} /></>
              ) : (
                <>Beli Sekarang <ChevronRight size={16} /></>
              )}
            </button>

            {payMethod === "wallet" && (
              <p className="text-center text-xs text-gray-400">
                Saldo kurang?{" "}
                <Link href="/topup/deposit" className="text-primary font-semibold hover:underline">
                  Isi saldo sekarang
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
