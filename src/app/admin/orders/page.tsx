"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { PaymentBadge, OrderStatusBadge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Select } from "@/components/ui/input";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const q = filter !== "ALL" ? `?status_pembayaran=${filter}` : "";
    fetch(`/api/admin/orders${q}`)
      .then(r => r.json())
      .then(d => setOrders(d.data?.orders ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Semua Pesanan</h1>
          <Select value={filter} onChange={e => setFilter(e.target.value)} className="w-36 text-sm">
            <option value="ALL">Semua</option>
            <option value="UNPAID">Belum Bayar</option>
            <option value="PAID">Lunas</option>
            <option value="EXPIRED">Kadaluarsa</option>
            <option value="CANCELLED">Dibatalkan</option>
          </Select>
        </div>

        {loading ? <PageLoader /> : orders.length === 0 ? (
          <EmptyState title="Tidak ada pesanan" description="" />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{o.buyer_name}</p>
                    <p className="text-xs text-gray-400">{o.seller_name} · {formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PaymentBadge status={o.status_pembayaran} />
                    <OrderStatusBadge status={o.status_pesanan} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-green-700">{formatRupiah(o.total_bayar)}</span>
                  {o.kurir_name && (
                    <span className="text-xs text-gray-500">Kurir: {o.kurir_name}</span>
                  )}
                </div>
                {o.alamat_pengiriman && (
                  <p className="text-xs text-gray-400 mt-1 truncate">📍 {o.alamat_pengiriman}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
