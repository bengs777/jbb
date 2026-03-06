"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { PaymentBadge, OrderStatusBadge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Package, ShoppingBag, TrendingUp, ArrowRight, Plus, Users, Wallet } from "lucide-react";

export default function SellerDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, earnings: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/products").then(r => r.json()),
      fetch("/api/seller/orders").then(r => r.json()),
      fetch("/api/seller/earnings").then(r => r.json()),
    ]).then(([products, orders, earnings]) => {
      setStats({
        products: products.data?.length ?? 0,
        orders: orders.data?.length ?? 0,
        earnings: earnings.data?.total ?? 0,
      });
      setRecentOrders((orders.data ?? []).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-foreground/70 text-sm font-medium mb-1">Selamat datang kembali,</p>
              <h1 className="text-2xl font-black tracking-tight">Dashboard Seller</h1>
              <p className="text-primary-foreground/60 text-sm mt-1">Kelola produk dan pantau pesanan Anda</p>
            </div>
            <Link href="/seller/products/new">
              <Button size="sm" className="bg-white text-primary hover:bg-gray-50 shadow-md border-0 font-bold">
                <Plus className="h-4 w-4" /> Produk Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 pb-24 md:pb-10">
        {loading ? <div className="pt-16"><PageLoader /></div> : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
              {[
                { label: "Produk Aktif", value: stats.products, icon: <Package className="h-4 w-4 sm:h-5 sm:w-5" />, color: "bg-primary/10 text-primary" },
                { label: "Total Orders", value: stats.orders, icon: <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />, color: "bg-primary/10 text-primary" },
                { label: "Pendapatan", value: formatRupiah(stats.earnings), icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />, color: "bg-primary/10 text-primary" },
              ].map((s) => (
                <div key={s.label} className="card p-2.5 sm:p-4 overflow-hidden relative">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${s.color}`}>
                    {s.icon}
                  </div>
                  <p className="text-sm sm:text-lg font-black text-gray-900 leading-none mb-1 truncate">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="grid gap-3 mb-5">
              {[
                { href: "/seller/products", label: "Kelola Produk", desc: "Tambah, edit, atau hapus produk", icon: <Package className="h-5 w-5" />, color: "bg-primary/10 text-primary" },
                { href: "/seller/orders", label: "Pesanan Masuk", desc: "Monitor transaksi & assign kurir", icon: <ShoppingBag className="h-5 w-5" />, color: "bg-primary/10 text-primary" },
                { href: "/seller/payout", label: "Pencairan Dana", desc: "Ajukan penarikan saldo ke rekening", icon: <Wallet className="h-5 w-5" />, color: "bg-primary/10 text-primary" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="group flex items-center gap-4 card p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>{item.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm">Pesanan Terbaru</h3>
                  <Link href="/seller/orders" className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1">
                    Lihat semua <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{o.buyer_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(o.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <PaymentBadge status={o.status_pembayaran} />
                        <span className="text-xs font-bold text-green-700">{formatRupiah(o.total_bayar)}</span>
                      </div>
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
