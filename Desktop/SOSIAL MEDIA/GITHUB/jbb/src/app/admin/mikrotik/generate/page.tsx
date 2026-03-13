"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader } from "@/components/ui/spinner";
import { ChevronLeft, Printer, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { formatRupiah } from "@/lib/utils";

interface Profile {
  name: string;
  rateLimit?: string;
  sessionTimeout?: string;
}

interface GeneratedVoucher {
  code: string;
  password: string;
}

export default function GenerateVoucherPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedVoucher[]>([]);

  const [form, setForm] = useState({
    profile: "",
    count: 1,
    price: 0,
    duration_hours: "",
    comment: "",
  });

  useEffect(() => {
    fetch("/api/admin/mikrotik/profiles")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setProfiles(json.data ?? []);
          if (json.data?.length > 0) setForm((f) => ({ ...f, profile: json.data[0].name }));
        }
      })
      .catch(() => toast.error("Gagal memuat profil MikroTik"))
      .finally(() => setLoadingProfiles(false));
  }, []);

  const handleGenerate = async () => {
    if (!form.profile) return toast.error("Pilih profil terlebih dahulu");
    if (form.count < 1 || form.count > 100) return toast.error("Jumlah voucher harus antara 1-100");

    setGenerating(true);
    try {
      const res = await fetch("/api/admin/mikrotik/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: form.profile,
          count: form.count,
          price: form.price,
          duration_hours: form.duration_hours ? Number(form.duration_hours) : undefined,
          comment: form.comment || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGenerated(json.data ?? []);
        toast.success(`${json.data?.length ?? 0} voucher berhasil dibuat!`);
      } else {
        toast.error(json.error ?? "Gagal membuat voucher");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="bg-primary text-white print:hidden">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
          <Link href="/admin/mikrotik" className="flex items-center gap-1.5 text-primary-foreground/60 text-sm mb-4 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
            MikroTik Manager
          </Link>
          <h1 className="text-xl font-black tracking-tight">Buat Voucher Hotspot</h1>
          <p className="text-primary-foreground/60 text-sm">Generate &amp; cetak voucher WiFi desa</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-24 md:pb-10">
        {generated.length === 0 ? (
          <div className="card p-5">
            {loadingProfiles ? (
              <PageLoader />
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Profil Hotspot</label>
                  {profiles.length === 0 ? (
                    <p className="text-sm text-red-500">Tidak ada profil ditemukan dari MikroTik</p>
                  ) : (
                    <select
                      value={form.profile}
                      onChange={(e) => setForm((f) => ({ ...f, profile: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {profiles.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}{p.rateLimit ? ` (${p.rateLimit})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Jumlah Voucher (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.count}
                    onChange={(e) => setForm((f) => ({ ...f, count: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="0 = gratis"
                  />
                  {form.price > 0 && (
                    <p className="text-xs text-primary mt-1">{formatRupiah(form.price)} per voucher</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    Durasi (jam) <span className="font-normal text-gray-400">— opsional</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.duration_hours}
                    onChange={(e) => setForm((f) => ({ ...f, duration_hours: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Contoh: 24"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    Keterangan <span className="font-normal text-gray-400">— opsional</span>
                  </label>
                  <input
                    type="text"
                    value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Contoh: Event Agustusan 2025"
                    maxLength={80}
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || profiles.length === 0}
                  className="flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors mt-2"
                >
                  <Plus className="h-4 w-4" />
                  {generating ? "Membuat Voucher..." : `Buat ${form.count} Voucher`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Action bar */}
            <div className="flex gap-3 mb-4 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-primary text-white font-semibold text-sm py-2.5 px-5 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Cetak
              </button>
              <button
                onClick={() => setGenerated([])}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Buat Lagi
              </button>
            </div>

            {/* Print grid */}
            <div className="grid grid-cols-2 gap-3 print:grid-cols-3 print:gap-2">
              {generated.map((v) => (
                <div
                  key={v.code}
                  className="card p-4 text-center border-2 border-dashed border-gray-200 print:border-gray-400 print:rounded-lg"
                >
                  <p className="text-xs text-gray-400 mb-2">WiFi Voucher — JBB Desa</p>
                  <p className="text-lg font-black font-mono tracking-widest text-gray-900">{v.code}</p>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Password</p>
                    <p className="text-base font-mono font-bold text-primary">{v.password}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{form.profile}</p>
                  {form.price > 0 && (
                    <p className="text-xs font-semibold text-green-600 mt-1">{formatRupiah(form.price)}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
