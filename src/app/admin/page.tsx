"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader } from "@/components/ui/spinner";
import { formatRupiah } from "@/lib/utils";
import { Users, ShoppingBag, TrendingUp, BarChart2, ArrowRight, Store, Wallet } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);

  useEffect(() => {
    function fetchAll() {
      fetch("/api/admin/orders", { cache: "no-store" })
        .then(r => r.json())
        .then(d => setStats(d.data?.stats))
        .finally(() => setLoading(false));
      fetch("/api/admin/users?pending_applications=true", { cache: "no-store" })
        .then(r => r.json())
        .then(d => setPendingCount(d.data?.length ?? 0));
      fetch("/api/admin/payouts?status=PENDING", { cache: "no-store" })
        .then(r => r.json())
        .then(d => setPendingPayouts(d.data?.length ?? 0));
    }
    fetchAll();
    const interval = setInterval(fetchAll, 15_000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { href: "/admin/sellers", label: "Pendaftaran Anggota", desc: pendingCount > 0 ? `${pendingCount} menunggu persetujuan` : "Tidak ada pending", icon: <Store className="h-5 w-5" />, color: "bg-orange-50 text-orange-700", badge: pendingCount },
    { href: "/admin/users", label: "Kelola Pengguna", desc: "Aktivasi & ubah role user", icon: <Users className="h-5 w-5" />, color: "bg-blue-50 text-blue-700", badge: 0 },
    { href: "/admin/orders", label: "Semua Pesanan", desc: "Monitor semua transaksi", icon: <ShoppingBag className="h-5 w-5" />, color: "bg-green-50 text-green-700", badge: 0 },
    { href: "/admin/earnings", label: "Laporan Pendapatan", desc: "Seller & kurir A/B/C", icon: <BarChart2 className="h-5 w-5" />, color: "bg-purple-50 text-purple-700", badge: 0 },
    { href: "/admin/payouts", label: "Pencairan Dana", desc: pendingPayouts > 0 ? `${pendingPayouts} permintaan menunggu` : "Kelola pencairan dana", icon: <Wallet className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-700", badge: pendingPayouts },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-rose-600 via-red-600 to-orange-500 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
          <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
          <p className="text-red-100/80 text-sm mt-1">Kelola ekosistem JBB Lingkup Desa</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-24 md:pb-10">
        {loading ? <div className="pt-16"><PageLoader /></div> : (
          <>
            {stats && (
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[
                  { label: "Total Orders", value: stats.total_orders, icon: <ShoppingBag className="h-4 w-4" />, color: "bg-blue-50 text-blue-600" },
                  { label: "Order Lunas", value: stats.paid_orders, icon: <TrendingUp className="h-4 w-4" />, color: "bg-green-50 text-green-600" },
                  { label: "Total Revenue", value: formatRupiah(stats.total_revenue ?? 0), icon: <BarChart2 className="h-4 w-4" />, color: "bg-purple-50 text-purple-600" },
                  { label: "Revenue Hari Ini", value: formatRupiah(stats.today_revenue ?? 0), icon: <TrendingUp className="h-4 w-4" />, color: "bg-orange-50 text-orange-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 ring-1 ring-gray-100 shadow-sm">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${s.color}`}>{s.icon}</div>
                    <p className="text-lg font-black text-gray-900 leading-none mb-1">{s.value}</p>
                    <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {links.map((item) => (
                <Link key={item.href} href={item.href}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-4 ring-1 ring-gray-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>{item.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
