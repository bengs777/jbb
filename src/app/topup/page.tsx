"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/layout/navbar";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Smartphone, Wifi, Zap, Wallet, Plus, RefreshCw, History,
  ChevronRight, BadgeDollarSign, Tv, Phone, Droplets,
  ShieldCheck, ArrowDownLeft,
} from "lucide-react";
import Link from "next/link";

const LAYANAN = [
  { key: "pulsa",   label: "Pulsa",       icon: Smartphone, from: "from-blue-500",    to: "to-blue-600" },
  { key: "data",    label: "Paket Data",  icon: Wifi,       from: "from-violet-500",  to: "to-purple-600" },
  { key: "pln",     label: "Token PLN",   icon: Zap,        from: "from-amber-400",   to: "to-yellow-500" },
  { key: "ewallet", label: "E-Wallet",    icon: Wallet,     from: "from-pink-500",    to: "to-rose-500" },
  { key: "tv",      label: "TV Kabel",    icon: Tv,         from: "from-sky-500",     to: "to-cyan-500" },
  { key: "telpon",  label: "Telepon",     icon: Phone,      from: "from-emerald-500", to: "to-green-500" },
  { key: "pdam",    label: "PDAM",        icon: Droplets,   from: "from-teal-500",    to: "to-cyan-600" },
  { key: "bpjs",    label: "BPJS",        icon: ShieldCheck,from: "from-red-500",     to: "to-rose-600" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  WAITING_PAYMENT: { label: "Menunggu Bayar", cls: "bg-yellow-100 text-yellow-700" },
  PENDING:         { label: "Diproses",       cls: "bg-blue-100 text-blue-700" },
  SUCCESS:         { label: "Berhasil",        cls: "bg-green-100 text-green-700" },
  FAILED:          { label: "Gagal",           cls: "bg-red-100 text-red-700" },
  REFUNDED:        { label: "Dikembalikan",    cls: "bg-gray-100 text-gray-600" },
};

export default function PPOBDashboard() {
  const { data: session, isPending } = useSession();
  const [balance, setBalance] = useState<{ balance: number; hold: number } | null>(null);
  const [recentTrx, setRecentTrx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes] = await Promise.all([
        fetch("/api/topup/balance"),
        fetch("/api/topup/transactions?page=1&limit=5"),
      ]);
      const [bJson, tJson] = await Promise.all([bRes.json(), tRes.json()]);
      if (bJson.success) setBalance(bJson.data);
      if (tJson.success) setRecentTrx(tJson.data.data ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (isPending) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Hero Balance ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-20">
          <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
            Saldo Dompet JBB
          </p>
          <div className="flex items-end justify-between">
            <div>
              {loading ? (
                <div className="h-10 w-48 bg-white/20 animate-pulse rounded-xl" />
              ) : (
                <h2 className="text-4xl font-black tracking-tight">
                  {balance ? formatRupiah(balance.balance) : "Rp 0"}
                </h2>
              )}
              {balance && balance.hold > 0 && (
                <p className="text-indigo-200 text-xs mt-1.5">
                  On-hold: {formatRupiah(balance.hold)}
                </p>
              )}
            </div>
            <button
              onClick={fetchAll}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex gap-3 mt-5">
            <Link
              href="/topup/deposit"
              className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-2xl hover:bg-indigo-50 transition shadow-lg"
            >
              <Plus size={14} /> Isi Saldo
            </Link>
            <Link
              href="/topup/history"
              className="flex items-center gap-2 bg-white/15 border border-white/25 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl hover:bg-white/25 transition"
            >
              <History size={14} /> Riwayat
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-16 space-y-4">

        {/* ── Layanan PPOB ──────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-5">
          <h2 className="text-sm font-black text-gray-700 mb-5">Layanan PPOB</h2>
          <div className="grid grid-cols-4 gap-x-2 gap-y-5">
            {LAYANAN.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.key}
                  href={`/topup/${l.key}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${l.from} ${l.to} flex items-center justify-center shadow-md
                                group-hover:scale-110 group-hover:shadow-xl transition-all duration-200`}
                  >
                    <Icon size={24} className="text-white drop-shadow" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 text-center leading-tight">
                    {l.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Banner promo ──────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="absolute right-0 top-0 w-28 h-full opacity-10">
            <BadgeDollarSign size={112} className="text-white absolute -right-4 -top-2 rotate-12" />
          </div>
          <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center shrink-0">
            <BadgeDollarSign size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-sm">Harga Transparan!</p>
            <p className="text-white/80 text-xs leading-snug mt-0.5">
              Semua produk PPOB margin resmi 5% — tidak ada biaya tersembunyi
            </p>
          </div>
          <ChevronRight size={16} className="text-white/60 shrink-0" />
        </div>

        {/* ── Transaksi Terakhir ─────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-700">Transaksi Terakhir</h2>
            <Link href="/topup/history" className="text-xs font-semibold text-indigo-600 hover:underline">
              Semua →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-100 animate-pulse rounded" />
                    <div className="h-3 w-20 bg-gray-100 animate-pulse rounded" />
                  </div>
                  <div className="h-4 w-16 bg-gray-100 animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : recentTrx.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <History size={22} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Belum ada transaksi</p>
              <p className="text-xs text-gray-300 mt-1">Mulai dari memilih layanan di atas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTrx.map((trx) => {
                const badge = STATUS_BADGE[trx.status] ?? { label: trx.status, cls: "bg-gray-100 text-gray-600" };
                const isDeposit = trx.product_code === "__DEPOSIT__";
                return (
                  <div key={trx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                      ${isDeposit ? "bg-green-100" : "bg-indigo-100"}`}>
                      {isDeposit
                        ? <ArrowDownLeft size={19} className="text-green-600" />
                        : <Smartphone size={19} className="text-indigo-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {isDeposit ? "Deposit Saldo" : trx.product_code}
                      </p>
                      <p className="text-xs text-gray-400 font-mono truncate">
                        {trx.target_number}
                      </p>
                      {trx.created_at && (
                        <p className="text-[10px] text-gray-300 mt-0.5">{formatDate(trx.created_at)}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800">
                        {formatRupiah(trx.price)}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Cara Bertransaksi ─────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-5">
          <h2 className="text-sm font-black text-gray-700 mb-3">Cara Bertransaksi</h2>
          <div className="space-y-2.5">
            {[
              ["1", "Isi saldo dompet JBB terlebih dahulu", "bg-indigo-600"],
              ["2", "Pilih layanan yang diinginkan (Pulsa, PLN, dll)", "bg-violet-600"],
              ["3", "Masukkan nomor tujuan & pilih nominal", "bg-blue-600"],
              ["4", "Konfirmasi — transaksi selesai otomatis", "bg-green-600"],
            ].map(([no, text, bg]) => (
              <div key={no} className="flex items-start gap-3">
                <span className={`${bg} text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                  {no}
                </span>
                <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
