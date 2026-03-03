"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { OrderStatusBadge, PaymentBadge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { MapPin, CheckCircle, PackageSearch, Bike, Phone, User } from "lucide-react";

const STATUS_FLOW: Record<string, string | null> = {
  MENUNGGU: "DIANTAR",
  DIANTAR: "SELESAI",
  SELESAI: null,
};

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Mulai Antar",
  DIANTAR: "Tandai Selesai",
};

type Tab = "available" | "mine";

export default function KurirOrdersPage() {
  const [tab, setTab] = useState<Tab>("available");
  const [available, setAvailable] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [a, m] = await Promise.all([
      fetch("/api/kurir/available").then(r => r.json()),
      fetch("/api/kurir/orders").then(r => r.json()),
    ]);
    setAvailable(a.data ?? []);
    setMyOrders(m.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const selfAssign = async (orderId: string) => {
    setUpdating(orderId);
    const r = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "self_assign" }),
    });
    if (r.ok) {
      toast.success("Pesanan berhasil diambil! Silakan antar.");
      await fetchAll();
      setTab("mine");
    } else {
      const d = await r.json();
      toast.error(d.error || "Gagal mengambil pesanan");
    }
    setUpdating(null);
  };

  const updateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (!nextStatus) return;
    setUpdating(orderId);
    const r = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", status_pesanan: nextStatus }),
    });
    if (r.ok) { toast.success(`Status diperbarui: ${nextStatus}`); fetchAll(); }
    else { const d = await r.json(); toast.error(d.error || "Gagal update status"); }
    setUpdating(null);
  };

  const OrderCard = ({ o, mode }: { o: any; mode: "available" | "mine" }) => {
    const namaPenerima = o.nama_penerima || o.buyer_name || "—";
    const noHp = o.no_hp_penerima || o.buyer_no_hp || null;
    const waHref = noHp
      ? `https://wa.me/62${noHp.replace(/^0/, "").replace(/\D/g, "")}`
      : null;
    const sellerNoHp = o.seller_no_hp || null;
    const sellerWaHref = sellerNoHp
      ? `https://wa.me/62${sellerNoHp.replace(/^0/, "").replace(/\D/g, "")}`
      : null;

    return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 p-4">
      {/* Header: status badges + tanggal */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-400">{formatDate(o.created_at)}</p>
        <div className="flex items-center gap-1.5">
          <PaymentBadge status={o.status_pembayaran} />
          {mode === "mine" && <OrderStatusBadge status={o.status_pesanan} />}
        </div>
      </div>

      {/* Recipient info block */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1.5">Info Penerima</p>
        <div className="flex items-center gap-2 mb-1">
          <User className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <p className="text-sm font-semibold text-slate-800">{namaPenerima}</p>
        </div>
        {noHp ? (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <div className="flex items-center gap-2">
              <a href={`tel:${noHp}`} className="text-sm font-semibold text-blue-600 hover:underline">{noHp}</a>
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold hover:bg-emerald-600 transition-colors"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            <p className="text-xs text-slate-400 italic">Nomor HP tidak tersedia</p>
          </div>
        )}
      </div>

      {/* Seller info block */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Info Penjual</p>
        <div className="flex items-center gap-2 mb-1">
          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <p className="text-sm font-semibold text-slate-700">{o.seller_name || "—"}</p>
        </div>
        {sellerNoHp ? (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="flex items-center gap-2">
              <a href={`tel:${sellerNoHp}`} className="text-sm font-semibold text-slate-600 hover:underline">{sellerNoHp}</a>
              {sellerWaHref && (
                <a
                  href={sellerWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold hover:bg-emerald-600 transition-colors"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            <p className="text-xs text-slate-400 italic">Nomor HP tidak tersedia</p>
          </div>
        )}
      </div>

      {/* Alamat */}
      {o.alamat_pengiriman && (
        <div className="flex items-start gap-2 text-sm text-slate-600 mb-3 bg-slate-50 rounded-xl p-3">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{o.alamat_pengiriman}</span>
        </div>
      )}

      {/* Items */}
      <div className="text-sm text-slate-600 mb-3">
        {(o.items ?? []).map((item: any) => (
          <div key={item.product_id} className="flex justify-between py-0.5">
            <span>{item.product_name} x{item.qty}</span>
            <span>{formatRupiah(item.qty * item.harga)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <div>
          <p className="text-sm font-bold text-emerald-700">{formatRupiah(o.total_bayar)}</p>
          {o.fee_kurir > 0 && (
            <p className="text-xs text-blue-600 font-medium">Komisi: {formatRupiah(o.fee_kurir)}</p>
          )}
        </div>

        {mode === "available" ? (
          <Button
            size="sm"
            onClick={() => selfAssign(o.id)}
            disabled={updating === o.id}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Bike className="h-3 w-3 mr-1" />
            {updating === o.id ? "Mengambil..." : "Ambil Pesanan"}
          </Button>
        ) : o.status_pesanan === "SELESAI" ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-4 w-4" /> Selesai
          </span>
        ) : STATUS_FLOW[o.status_pesanan] && o.status_pembayaran === "PAID" ? (
          <Button
            size="sm"
            onClick={() => updateStatus(o.id, o.status_pesanan)}
            disabled={updating === o.id}
          >
            {updating === o.id ? "..." : STATUS_LABEL[o.status_pesanan]}
          </Button>
        ) : null}
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-xl font-black text-slate-800 mb-4 tracking-tight">Pengiriman</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("available")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-colors ${
              tab === "available"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <PackageSearch className="h-4 w-4" />
            Tersedia
            {available.length > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {available.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-colors ${
              tab === "mine"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Bike className="h-4 w-4" />
            Pesanan Saya
            {myOrders.filter(o => o.status_pesanan !== "SELESAI").length > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {myOrders.filter(o => o.status_pesanan !== "SELESAI").length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <PageLoader />
        ) : tab === "available" ? (
          available.length === 0 ? (
            <EmptyState
              title="Tidak ada pesanan tersedia"
              description="Pesanan baru yang sudah dibayar akan muncul di sini"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {available.map(o => <OrderCard key={o.id} o={o} mode="available" />)}
            </div>
          )
        ) : myOrders.length === 0 ? (
          <EmptyState
            title="Belum ada pengiriman"
            description="Ambil pesanan dari tab Tersedia untuk mulai mengantarkan"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {myOrders.map(o => <OrderCard key={o.id} o={o} mode="mine" />)}
          </div>
        )}
      </div>
    </div>
  );
}
