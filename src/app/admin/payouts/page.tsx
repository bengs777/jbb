"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Wallet, Clock, CheckCircle, XCircle, Store, Truck } from "lucide-react";

interface Payout {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: "SELLER" | "KURIR";
  jumlah: number;
  nama_bank: string;
  no_rekening: string;
  nama_pemilik: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  catatan_admin: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  PENDING: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  APPROVED: { label: "Disetujui", color: "bg-green-100 text-green-700", icon: CheckCircle },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [processing, setProcessing] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<Record<string, string>>({});

  const fetchData = async () => {
    const url = filter === "ALL" ? "/api/admin/payouts" : `/api/admin/payouts?status=${filter}`;
    const res = await fetch(url);
    const json = await res.json();
    setPayouts(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); fetchData(); }, [filter]);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, catatan_admin: catatan[id] ?? null }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Gagal"); return; }
      toast.success(status === "APPROVED" ? "Payout disetujui!" : "Payout ditolak");
      fetchData();
    } finally {
      setProcessing(null);
    }
  };

  const pending = payouts.filter((p) => p.status === "PENDING");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Permintaan Pencairan</h1>
          {pending.length > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "ALL" ? "Semua" : f === "PENDING" ? "Menunggu" : f === "APPROVED" ? "Disetujui" : "Ditolak"}
            </button>
          ))}
        </div>

        {loading ? (
          <PageLoader />
        ) : payouts.length === 0 ? (
          <EmptyState
            title="Tidak ada permintaan"
            description="Belum ada permintaan pencairan dana"
            icon={<Wallet className="h-16 w-16" />}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {payouts.map((p) => {
              const cfg = STATUS_CONFIG[p.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        p.role === "SELLER" ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"
                      }`}>
                        {p.role === "SELLER" ? <Store className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.user_name}</p>
                        <p className="text-xs text-gray-400">{p.user_email} · {p.role}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />{cfg.label}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-xl font-black text-gray-900">{formatRupiah(p.jumlah)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.nama_bank} · {p.no_rekening}
                    </p>
                    <p className="text-xs text-gray-500">a/n {p.nama_pemilik}</p>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">Diajukan: {formatDate(p.created_at)}</p>

                  {p.catatan_admin && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                      <span className="font-medium">Catatan:</span> {p.catatan_admin}
                    </p>
                  )}

                  {/* Actions for PENDING */}
                  {p.status === "PENDING" && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Catatan untuk pengguna (opsional)"
                        value={catatan[p.id] ?? ""}
                        onChange={(e) => setCatatan((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(p.id, "APPROVED")}
                          loading={processing === p.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" /> Setujui
                        </Button>
                        <Button
                          onClick={() => handleAction(p.id, "REJECTED")}
                          loading={processing === p.id}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-sm"
                        >
                          <XCircle className="h-4 w-4" /> Tolak
                        </Button>
                      </div>
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
