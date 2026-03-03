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
  const [tab, setTab] = useState<"seller" | "kurir" | "pembeli" | "admin">("seller");
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
  const earnings: any[] = (isBuyer || isAdmin) ? [] : (tab === "seller" ? (data?.seller ?? []) : (data?.kurir ?? []));
  const grouped = groupByUser(earnings);
  const buyers: any[] = data?.buyers ?? [];
  const adminRows: any[] = data?.admin ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Laporan Pendapatan</h1>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-4">
              <p className="text-xs text-slate-500 mb-1">Fee Admin</p>
              <p className="text-base font-black text-rose-700">{formatRupiah(data.total_admin ?? 0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-4">
              <p className="text-xs text-slate-500 mb-1">Saldo Pembeli</p>
              <p className="text-base font-black text-violet-700">{formatRupiah(data.total_buyer_saldo ?? 0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-4">
              <p className="text-xs text-slate-500 mb-1">Total Seller</p>
              <p className="text-base font-black text-emerald-700">{formatRupiah(data.total_seller ?? 0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-4">
              <p className="text-xs text-slate-500 mb-1">Total Kurir</p>
              <p className="text-base font-black text-blue-700">{formatRupiah(data.total_kurir ?? 0)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-slate-100 shadow-sm p-1 mb-6">
          {(["admin", "seller", "kurir", "pembeli"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors capitalize ${tab === t ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "admin" ? "Admin" : t === "seller" ? "Seller" : t === "kurir" ? "Kurir" : "Pembeli"}
            </button>
          ))}
        </div>

        {loading ? <PageLoader /> : isAdmin ? (
          adminRows.length === 0 ? <EmptyState title="Belum ada pendapatan admin" description="" /> : (
            <div className="flex flex-col gap-2">
              {adminRows.map((r: any) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.buyer_name}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.created_at)}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">#{(r.order_id ?? "").slice(0, 12).toUpperCase()}</p>
                  </div>
                  <span className="text-sm font-black text-rose-700">{formatRupiah(r.jumlah ?? 0)}</span>
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
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-black text-sm">
                      {(b.user_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{b.user_name}</p>
                      <p className="text-xs text-slate-400">{b.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-violet-700">{formatRupiah(b.saldo ?? 0)}</p>
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
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-800 text-sm">{userName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{rows.length} transaksi</span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs font-semibold text-emerald-600">Saldo {formatRupiah(saldo)}</span>
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
                            <span className="text-sm font-bold text-emerald-700">{formatRupiah(e.jumlah)}</span>
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
