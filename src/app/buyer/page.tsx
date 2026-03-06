"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";
import { ShoppingBag, ShoppingCart, Clock, ArrowRight, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

export default function BuyerDashboard() {
  const { data: session, isPending } = useSession();
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [cartCount, setCartCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/cart").then(r => r.json()),
    ]).then(([orders, cart]) => {
      setOrderCount(orders.data?.length ?? 0);
      setCartCount(cart.data?.length ?? 0);
    }).catch(() => {});
  }, []);

  if (isPending) return null;

  const name = session?.user?.name?.split(" ")[0] ?? "Pembeli";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
          <p className="text-primary-foreground/70 text-sm font-medium mb-0.5">Selamat datang,</p>
          <h1 className="text-3xl font-black tracking-tight">{name} 👋</h1>
          <p className="text-primary-foreground/60 text-sm mt-1">Selamat berbelanja di JBB Jual Beli Buntu</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 pb-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Keranjang</span>
            </div>
            <p className="text-3xl font-black text-gray-900 leading-none">{cartCount ?? "–"}</p>
            <p className="text-xs text-gray-400 mt-1">item saat ini</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Pesanan</span>
            </div>
            <p className="text-3xl font-black text-gray-900 leading-none">{orderCount ?? "–"}</p>
            <p className="text-xs text-gray-400 mt-1">total pesanan</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-3">
          {[
            { href: "/topup", icon: <Smartphone className="h-5 w-5" />, label: "Top-Up & PPOB", desc: "Pulsa, Data, PLN, E-Wallet", color: "bg-primary/10 text-primary" },
            { href: "/katalog", icon: <ShoppingBag className="h-5 w-5" />, label: "Lihat Katalog", desc: "Browse produk lokal desa", color: "bg-primary/10 text-primary" },
            { href: "/buyer/cart", icon: <ShoppingCart className="h-5 w-5" />, label: "Keranjang Belanja", desc: "Lihat & checkout item", color: "bg-primary/10 text-primary" },
            { href: "/buyer/orders", icon: <Clock className="h-5 w-5" />, label: "Riwayat Pesanan", desc: "Cek status & riwayat", color: "bg-primary/10 text-primary" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 card p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
