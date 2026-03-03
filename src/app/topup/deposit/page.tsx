"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { formatRupiah } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

const PRESETS = [10_000, 25_000, 50_000, 100_000, 200_000, 500_000];

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const numericAmount = Number(amount.replace(/[^0-9]/g, ""));

  const handleDeposit = async () => {
    setError("");
    if (!numericAmount || numericAmount < 10_000) {
      return setError("Minimal deposit Rp 10.000");
    }
    if (numericAmount > 10_000_000) {
      return setError("Maksimal deposit Rp 10.000.000");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/topup/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Gagal membuat link pembayaran");
      } else {
        setPaymentUrl(json.data.paymentUrl);
        setInvoiceId(json.data.invoiceId);
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
        {/* Back */}
        <Link
          href="/topup"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline mb-6"
        >
          <ArrowLeft size={14} />
          Kembali ke Top-Up
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-800">Isi Saldo Dompet</h1>
            <p className="text-sm text-gray-500 mt-1">
              Saldo akan dikreditkan otomatis setelah pembayaran berhasil via Mayar.id
            </p>
          </div>

          {/* Preset amounts */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Pilih Nominal
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`py-2 rounded-xl border-2 text-sm font-semibold transition ${
                    numericAmount === p
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-100 bg-gray-50 text-gray-700 hover:border-indigo-200"
                  }`}
                >
                  {formatRupiah(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Atau Masukkan Nominal
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                Rp
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={amount ? Number(amount.replace(/[^0-9]/g, "")).toLocaleString("id-ID") : ""}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {numericAmount > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                = {formatRupiah(numericAmount)}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Payment URL */}
          {paymentUrl ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-green-800">
                ✅ Link pembayaran berhasil dibuat
              </p>
              <p className="text-xs text-green-600">Invoice: {invoiceId}</p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition text-sm"
              >
                Bayar Sekarang
                <ExternalLink size={14} />
              </a>
              <p className="text-xs text-green-600 text-center">
                Saldo akan masuk otomatis setelah pembayaran dikonfirmasi
              </p>
            </div>
          ) : (
            <button
              onClick={handleDeposit}
              disabled={loading || !numericAmount}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Membuat link..." : "Lanjutkan Pembayaran"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
