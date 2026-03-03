"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { PaymentBadge, OrderStatusBadge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Truck } from "lucide-react";

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [kurirList, setKurirList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const fetchData = () => {
    Promise.all([
      fetch("/api/seller/orders").then(r => r.json()),
      fetch("/api/kurir/list").then(r => r.json()),
    ]).then(([o, k]) => {
      setOrders(o.data ?? []);
      setKurirList(k.data ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const assignKurir = async (orderId: string) => {
    const kurirId = selected[orderId];
    if (!kurirId) { toast.error("Pilih kurir terlebih dahulu"); return; }
    setAssigning(orderId);
    const r = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_kurir", kurir_id: kurirId }),
    });
    if (r.ok) { toast.success("Kurir berhasil di-assign!"); fetchData(); }
    else { const d = await r.json(); toast.error(d.error || "Gagal assign kurir"); }
    setAssigning(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Pesanan Masuk</h1>

        {loading ? <PageLoader /> : orders.length === 0 ? (
          <EmptyState title="Belum ada pesanan" description="Pesanan dari pembeli akan muncul di sini" />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{o.buyer_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PaymentBadge status={o.status_pembayaran} />
                    <OrderStatusBadge status={o.status_pesanan} />
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-50 pt-2 mt-2">
                  {(o.items ?? []).map((item: any) => (
                    <div key={item.product_id} className="flex justify-between text-sm text-gray-600 py-0.5">
                      <span>{item.product_name} x{item.qty}</span>
                      <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <span className="text-sm font-bold text-green-700">{formatRupiah(o.total_bayar)}</span>
                  {o.status_pembayaran === "PAID" && !o.kurir_id && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selected[o.id] ?? ""}
                        onChange={e => setSelected(s => ({ ...s, [o.id]: e.target.value }))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                      >
                        <option value="">Pilih Kurir</option>
                        {kurirList.map((k: any) => (
                          <option key={k.id} value={k.id}>{k.name}</option>
                        ))}
                      </select>
                      <Button size="sm" onClick={() => assignKurir(o.id)} disabled={assigning === o.id}>
                        <Truck className="h-3 w-3" />
                        {assigning === o.id ? "..." : "Assign"}
                      </Button>
                    </div>
                  )}
                  {o.kurir_id && (
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Truck className="h-3 w-3" /> {o.kurir_name ?? "Kurir assigned"}
                    </span>
                  )}
                </div>

                {o.alamat_pengiriman && (
                  <p className="text-xs text-gray-400 mt-1">📍 {o.alamat_pengiriman}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
