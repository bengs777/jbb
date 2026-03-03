"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Wallet, Clock, CheckCircle, XCircle, Send } from "lucide-react";

interface PayoutRequest {
  id: string;
  jumlah: number;
  nama_bank: string;
  no_rekening: string;
  nama_pemilik: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  catatan_admin: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  PENDING: { label: "Menunggu", color: "bg-amber-100 text-amber-700 ring-1 ring-amber-200", icon: Clock },
  APPROVED: { label: "Disetujui", color: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", icon: CheckCircle },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-600 ring-1 ring-red-200", icon: XCircle },
};

export default function KurirPayoutPage() {
  const [saldo, setSaldo] = useState(0);
  const [history, setHistory] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ jumlah: "", nama_bank: "", no_rekening: "", nama_pemilik: "" });

  const fetchData = async () => {
    const res = await fetch("/api/kurir/payout");
    const json = await res.json();
    setSaldo(json.data?.saldo ?? 0);
    setHistory(json.data?.payouts ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const hasPending = history.some((p) => p.status === "PENDING");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const jumlah = parseInt(form.jumlah);
    if (!jumlah || jumlah <= 0) { toast.error("Jumlah tidak valid"); return; }
    if (jumlah > saldo) { toast.error("Jumlah melebihi saldo"); return; }
    if (!form.nama_bank.trim() || !form.no_rekening.trim() || !form.nama_pemilik.trim()) {
      toast.error("Semua field wajib diisi"); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/kurir/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, jumlah }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Gagal mengirim"); return; }
      toast.success("Permintaan payout dikirim!");
      setForm({ jumlah: "", nama_bank: "", no_rekening: "", nama_pemilik: "" });
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50"><Navbar /><PageLoader /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pencairan Dana</h1>

        {/* Saldo Card */}
        <div className="bg-gradient-to-br from-sky-600 to-indigo-500 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Saldo Tersedia</span>
          </div>
          <p className="text-3xl font-black">{formatRupiah(saldo)}</p>
          <p className="text-xs opacity-70 mt-1">Total pendapatan dikurangi payout yang sudah disetujui</p>
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm shadow-slate-100/50">
          <h2 className="font-semibold text-slate-800 mb-4">Ajukan Pencairan</h2>
          {hasPending ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
              <Clock className="h-5 w-5 flex-shrink-0" />
              <span>Permintaan pencairan sebelumnya sedang diproses admin. Tunggu hingga selesai.</span>
            </div>
          ) : saldo <= 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">Saldo belum cukup untuk dicairkan.</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                label="Jumlah Pencairan (Rp)"
                type="number"
                placeholder={`Maks. ${saldo.toLocaleString("id-ID")}`}
                value={form.jumlah}
                onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
              />
              <Input
                label="Nama Bank"
                placeholder="BCA / BRI / Mandiri / dll"
                value={form.nama_bank}
                onChange={(e) => setForm({ ...form, nama_bank: e.target.value })}
              />
              <Input
                label="Nomor Rekening"
                placeholder="1234567890"
                value={form.no_rekening}
                onChange={(e) => setForm({ ...form, no_rekening: e.target.value })}
              />
              <Input
                label="Nama Pemilik Rekening"
                placeholder="Sesuai buku tabungan"
                value={form.nama_pemilik}
                onChange={(e) => setForm({ ...form, nama_pemilik: e.target.value })}
              />
              <Button type="submit" loading={submitting} className="w-full mt-1">
                <Send className="h-4 w-4" /> Ajukan Pencairan
              </Button>
            </form>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h2 className="font-semibold text-slate-800">Riwayat Pencairan</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {history.map((p) => {
                const cfg = STATUS_CONFIG[p.status];
                const Icon = cfg.icon;
                return (
                  <div key={p.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{formatRupiah(p.jumlah)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                        <Icon className="h-3.5 w-3.5" />{cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{p.nama_bank} · {p.no_rekening} · {p.nama_pemilik}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(p.created_at)}</p>
                    {p.catatan_admin && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2 mt-2">
                        <span className="font-medium">Catatan admin:</span> {p.catatan_admin}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
