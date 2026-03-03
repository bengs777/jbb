"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader } from "@/components/ui/spinner";
import { OrderStatusBadge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Package, TrendingUp, ArrowRight, Wallet } from "lucide-react";

export default function KurirDashboard() {
  const [stats, setStats] = useState({ orders: 0, earnings: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/kurir/orders").then(r => r.json()),
      fetch("/api/kurir/earnings").then(r => r.json()),
    ]).then(([orders, earnings]) => {
      setStats({ orders: orders.data?.length ?? 0, earnings: earnings.data?.total ?? 0 });
      setRecentOrders((orders.data ?? []).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 text-white">
        <div className="max-w-xl mx-auto px-4 pt-8 pb-16">
          <h1 className="text-2xl font-black tracking-tight">Dashboard Kurir</h1>
          <p className="text-blue-100/80 text-sm mt-1">Monitor & kelola pengiriman Anda</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 pb-10">
        {loading ? <div className="pt-16"><PageLoader /></div> : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { label: "Total Pengiriman", value: stats.orders, icon: <Package className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
                { label: "Pendapatan", value: formatRupiah(stats.earnings), icon: <TrendingUp className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-4 ring-1 ring-gray-100 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
                  <p className="text-xl font-black text-gray-900 leading-none mb-1">{s.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <Link href="/kurir/orders"
              className="group flex items-center gap-4 bg-white rounded-2xl p-4 ring-1 ring-gray-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 mb-3">
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Daftar Pengiriman</p>
                <p className="text-xs text-gray-400 mt-0.5">Lihat & update status pengiriman</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link href="/kurir/payout"
              className="group flex items-center gap-4 bg-white rounded-2xl p-4 ring-1 ring-gray-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 mb-5">
              <div className="w-11 h-11 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Pencairan Dana</p>
                <p className="text-xs text-gray-400 mt-0.5">Ajukan penarikan saldo ke rekening</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {recentOrders.length > 0 && (
              <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm">Pengiriman Terbaru</h3>
                  <Link href="/kurir/orders" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                    Lihat semua <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{o.buyer_name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-48">{o.alamat_pengiriman}</p>
                      </div>
                      <OrderStatusBadge status={o.status_pesanan} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
