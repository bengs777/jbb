"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PaymentBadge, OrderStatusBadge } from "@/components/ui/badge";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { ShoppingBag, Eye, X, Phone, User, Bike } from "lucide-react";

interface Order {
  id: string;
  total_bayar: number;
  status_pembayaran: string;
  status_pesanan: string;
  alamat_pengiriman: string;
  created_at: string;
  expired_at: string;
  seller_name: string | null;
  seller_no_hp: string | null;
  kurir_name: string | null;
  kurir_no_hp: string | null;
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const json = await res.json();
    setOrders(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Yakin ingin membatalkan pesanan ini?")) return;
    setCancelling(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Pesanan dibatalkan");
        fetchOrders();
      } else {
        toast.error(json.error ?? "Gagal membatalkan");
      }
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <h1 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Riwayat Pesanan</h1>

        {loading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            title="Belum ada pesanan"
            description="Mulai belanja dan order pertama Anda!"
            icon={<ShoppingBag className="h-16 w-16" />}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const sellerWa = order.seller_no_hp
                ? `https://wa.me/62${order.seller_no_hp.replace(/^0/, "").replace(/\D/g, "")}`
                : null;
              const kurirWa = order.kurir_no_hp
                ? `https://wa.me/62${order.kurir_no_hp.replace(/^0/, "").replace(/\D/g, "")}`
                : null;
              return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">#{order.id.slice(0, 12).toUpperCase()}</p>
                    <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PaymentBadge status={order.status_pembayaran} />
                    <OrderStatusBadge status={order.status_pesanan} />
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-2">📍 {order.alamat_pengiriman}</p>
                <p className="text-lg font-bold text-emerald-700 mb-3">{formatRupiah(order.total_bayar)}</p>

                {/* Seller & Kurir contact */}
                <div className="flex flex-col gap-2 mb-3">
                  {(order.seller_name || order.seller_no_hp) && (
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">Penjual:</span>
                        <span className="text-xs font-semibold text-slate-700">{order.seller_name}</span>
                      </div>
                      {order.seller_no_hp && (
                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${order.seller_no_hp}`} className="text-xs text-primary font-semibold hover:underline">{order.seller_no_hp}</a>
                          {sellerWa && (
                            <a href={sellerWa} target="_blank" rel="noopener noreferrer"
                              className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold hover:bg-emerald-600 transition-colors">
                              WA
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {order.kurir_name && (
                    <div className="flex items-center justify-between bg-primary/10 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Bike className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-primary">Kurir:</span>
                        <span className="text-xs font-semibold text-slate-700">{order.kurir_name}</span>
                      </div>
                      {order.kurir_no_hp && (
                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${order.kurir_no_hp}`} className="text-xs text-primary font-semibold hover:underline">{order.kurir_no_hp}</a>
                          {kurirWa && (
                            <a href={kurirWa} target="_blank" rel="noopener noreferrer"
                              className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold hover:bg-emerald-600 transition-colors">
                              WA
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {order.status_pembayaran === "UNPAID" && (
                    <Link href={`/buyer/payment/${order.id}`}>
                      <Button size="sm" variant="primary">
                        Bayar Sekarang
                      </Button>
                    </Link>
                  )}
                  {order.status_pembayaran === "UNPAID" && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={cancelling === order.id}
                      onClick={() => cancelOrder(order.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Batal
                    </Button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
