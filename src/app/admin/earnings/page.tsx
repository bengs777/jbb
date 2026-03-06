"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { ClassBadge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/utils";

function groupByUser(rows: any[]) {
  const map = new Map<string, any[]>();
  for (const row of rows) {
    const key = row.user_id ?? row.user_name ?? "Unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return Array.from(map.entries()).sort((a, b) => {
    const totalA = a[1].reduce((s: number, r: any) => s + (r.jumlah ?? 0), 0);
    const totalB = b[1].reduce((s: number, r: any) => s + (r.jumlah ?? 0), 0);
    return totalB - totalA;
  });
}

export default function AdminEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tab, setTab] = useState<"seller" | "kurir" | "pembeli" | "admin" | "game">("seller");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function fetchData(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/admin/earnings", { cache: "no-store" });
      const json = await res.json();
      setData(json.data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10_000);
    return () => clearInterval(interval);
  }, []);

  function toggleUser(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const isBuyer = tab === "pembeli";
  const isAdmin = tab === "admin";
  const isGame = tab === "game";
  const earnings: any[] = (isBuyer || isAdmin || isGame) ? [] : (tab === "seller" ? (data?.seller ?? []) : (data?.kurir ?? []));
  const grouped = groupByUser(earnings);
  const buyers: any[] = data?.buyers ?? [];
  const adminRows: any[] = data?.admin ?? [];
  const gameRows: any[] = data?.game ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Laporan Pendapatan</h1>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? "Memperbarui..." : lastUpdated ? `${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Refresh"}
          </button>
        </div>

        {/* Summary */}
        {data && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">Fee Admin</p>
              <p className="text-base font-black text-primary">{formatRupiah(data.total_admin ?? 0)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">Profit Game Voucher</p>
              <p className="text-base font-black text-green-600">{formatRupiah(data.total_game_profit ?? 0)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">Total Seller</p>
              <p className="text-base font-black text-primary">{formatRupiah(data.total_seller ?? 0)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">Total Kurir</p>
              <p className="text-base font-black text-primary">{formatRupiah(data.total_kurir ?? 0)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-slate-100 shadow-sm p-1 mb-6 gap-0.5 flex-wrap">
          {(["admin", "game", "seller", "kurir", "pembeli"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors capitalize ${tab === t ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "admin" ? "Admin" : t === "game" ? "Game" : t === "seller" ? "Seller" : t === "kurir" ? "Kurir" : "Pembeli"}
            </button>
          ))}
        </div>

        {loading ? <PageLoader /> : isGame ? (
          gameRows.length === 0 ? <EmptyState title="Belum ada penjualan game voucher" description="" /> : (
            <div className="flex flex-col gap-2">
              {gameRows.map((r: any) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.game_name} — {r.nominal_label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">ID: {r.target_user_id}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">#{(r.invoice_id ?? "").slice(5, 17)}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-black text-green-600">+{formatRupiah(r.admin_profit ?? 0)}</p>
                      <p className="text-xs text-slate-400">{formatRupiah(r.amount ?? 0)} total</p>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                        r.delivery_status === "DELIVERED" ? "bg-green-100 text-green-700"
                        : r.delivery_status === "PROCESSING" ? "bg-blue-100 text-blue-600"
                        : r.delivery_status === "FAILED" ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-500"
                      }`}>
                        {r.delivery_status === "DELIVERED" ? "Terkirim"
                          : r.delivery_status === "PROCESSING" ? "Diproses"
                          : r.delivery_status === "FAILED" ? "Gagal"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                  {r.pp_sn && (
                    <p className="text-xs text-primary font-mono mt-2 bg-primary/5 rounded-lg px-2 py-1">SN: {r.pp_sn}</p>
                  )}
                </div>
              ))}
            </div>
          )
        ) : isAdmin ? (
          adminRows.length === 0 ? <EmptyState title="Belum ada pendapatan admin" description="" /> : (
            <div className="flex flex-col gap-2">
              {adminRows.map((r: any) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.buyer_name}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.created_at)}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">#{(r.order_id ?? "").slice(0, 12).toUpperCase()}</p>
                  </div>
                  <span className="text-sm font-black text-primary">{formatRupiah(r.jumlah ?? 0)}</span>
                </div>
              ))}
            </div>
          )
        ) : isBuyer ? (
          buyers.length === 0 ? <EmptyState title="Belum ada pembeli" description="" /> : (
            <div className="flex flex-col gap-2">
              {buyers.map((b: any) => (
                <div key={b.user_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                      {(b.user_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{b.user_name}</p>
                      <p className="text-xs text-slate-400">{b.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{formatRupiah(b.saldo ?? 0)}</p>
                    {(b.saldo_hold ?? 0) > 0 && (
                      <p className="text-xs text-amber-500">Hold {formatRupiah(b.saldo_hold)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : earnings.length === 0 ? (
          <EmptyState title="Belum ada data" description="" />
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.map(([userId, rows]) => {
              const userTotal = rows.reduce((s: number, r: any) => s + (r.jumlah ?? 0), 0);
              const userName = rows[0]?.user_name ?? userId;
              const saldo = rows[0]?.saldo ?? 0;
              const saldoHold = rows[0]?.saldo_hold ?? 0;
              const isOpen = !!expanded[userId];
              return (
                <div key={userId} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 overflow-hidden">
                  <button
                    onClick={() => toggleUser(userId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-800 text-sm">{userName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{rows.length} transaksi</span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs font-semibold text-primary">Saldo {formatRupiah(saldo)}</span>
                          {saldoHold > 0 && (
                            <span className="text-xs text-amber-500">Hold {formatRupiah(saldoHold)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Total Earned</p>
                        <p className="text-sm font-black text-slate-700">{formatRupiah(userTotal)}</p>
                      </div>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 flex flex-col divide-y divide-slate-50">
                      {rows.map((e: any) => (
                        <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500">{formatDate(e.created_at)}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">#{(e.order_id ?? "").slice(0, 12).toUpperCase()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {e.klasifikasi && <ClassBadge klasifikasi={e.klasifikasi} />}
                            <span className="text-sm font-bold text-primary">{formatRupiah(e.jumlah)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
