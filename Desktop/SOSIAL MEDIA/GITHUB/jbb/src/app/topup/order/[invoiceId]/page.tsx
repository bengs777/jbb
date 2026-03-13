"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { CheckCircle, Clock, XCircle, Wifi, ExternalLink, Copy } from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

interface TopupOrder {
  invoiceId: string;
  status: string; // WAITING_PAYMENT | PENDING | SUCCESS | FAILED
  productCode: string;
  productName: string | null;
  targetNumber: string;
  price: number;
  mayarPaymentUrl: string | null;
  mayarPaidAt: string | null;
  sn: string | null;
  failureReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function TopupOrderStatusPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [order, setOrder] = useState<TopupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/topup/order/${invoiceId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok) setOrder(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 3s while waiting/pending (max 40 = 2 minutes)
    const interval = setInterval(() => {
      setPollCount((c) => {
        if (c >= 40) { clearInterval(interval); return c; }
        fetchStatus();
        return c + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // Stop polling when done
  useEffect(() => {
    if (order?.status === "SUCCESS" || order?.status === "FAILED") {
      setPollCount(999); // triggers early stop on next interval
    }
  }, [order?.status]);

  const copySN = () => {
    if (!order?.sn) return;
    navigator.clipboard.writeText(order.sn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Wifi className="w-8 h-8 text-primary" />
            </div>
            <p className="text-gray-500">Mengecek status order…</p>
          </div>

        ) : !order ? (
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-8">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h1 className="text-xl font-black text-gray-800">Order tidak ditemukan</h1>
            <p className="text-sm text-gray-500 mt-2">Invoice ID: {invoiceId}</p>
            <Link
              href="/topup"
              className="mt-6 inline-block bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-primary-hover transition"
            >
              Kembali ke Topup
            </Link>
          </div>

        ) : order.status === "SUCCESS" ? (
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-green-700 mb-1">Transaksi Berhasil!</h1>
            <p className="text-gray-500 text-sm mb-6">
              {order.productName ?? order.productCode} telah dikirim ke {order.targetNumber}.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Produk</span>
                <span className="font-semibold">{order.productName ?? order.productCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nomor Tujuan</span>
                <span className="font-semibold font-mono">{order.targetNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Bayar</span>
                <span className="font-bold text-primary">{formatRupiah(order.price)}</span>
              </div>
              {order.sn && (
                <div className="flex justify-between items-center pt-1 border-t border-dashed">
                  <span className="text-gray-500">Serial Number</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-gray-800">{order.sn}</span>
                    <button
                      onClick={copySN}
                      className="text-primary hover:text-primary-hover transition"
                      title="Salin SN"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span>Invoice</span>
                <span className="font-mono">{order.invoiceId}</span>
              </div>
            </div>

            {copied && (
              <p className="text-xs text-green-500 mb-3">✓ SN disalin!</p>
            )}

            <div className="flex gap-3 mt-2">
              <Link
                href={`/topup/${order.productCode.split("_")[0]?.toLowerCase() ?? "pulsa"}`}
                className="flex-1 border-2 border-primary/30 text-primary font-bold text-sm py-2.5 rounded-xl hover:bg-primary/5 transition"
              >
                Transaksi Lagi
              </Link>
              <Link
                href="/topup/history"
                className="flex-1 bg-primary text-white font-bold text-sm py-2.5 rounded-xl text-center hover:bg-primary-hover transition"
              >
                Lihat Riwayat
              </Link>
            </div>
          </div>

        ) : order.status === "FAILED" ? (
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-red-700 mb-1">Transaksi Gagal</h1>
            <p className="text-gray-500 text-sm mb-6">
              {order.failureReason ?? "Terjadi kesalahan saat memproses order."}
            </p>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Produk</span>
                <span className="font-semibold">{order.productName ?? order.productCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nomor Tujuan</span>
                <span className="font-semibold font-mono">{order.targetNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Invoice</span>
                <span className="font-mono">{order.invoiceId}</span>
              </div>
            </div>
            <Link
              href="/topup"
              className="w-full block bg-primary text-white font-bold py-3 rounded-2xl hover:bg-primary-hover transition"
            >
              Coba Lagi
            </Link>
          </div>

        ) : (
          /* WAITING_PAYMENT or PENDING */
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-8">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-9 h-9 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-gray-800 mb-1">
              {order.status === "WAITING_PAYMENT" ? "Menunggu Pembayaran" : "Sedang Diproses"}
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              {order.status === "WAITING_PAYMENT"
                ? "Selesaikan pembayaran untuk melanjutkan."
                : "Pesanan sedang dikirim ke operator. Mohon tunggu."}
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Produk</span>
                <span className="font-semibold">{order.productName ?? order.productCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nomor Tujuan</span>
                <span className="font-semibold font-mono">{order.targetNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Bayar</span>
                <span className="font-bold text-primary">{formatRupiah(order.price)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Invoice</span>
                <span className="font-mono">{order.invoiceId}</span>
              </div>
            </div>

            {order.status === "WAITING_PAYMENT" && order.mayarPaymentUrl && (
              <a
                href={order.mayarPaymentUrl}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-2xl hover:bg-primary-hover transition mb-3"
              >
                Lanjutkan Pembayaran <ExternalLink size={15} />
              </a>
            )}

            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Halaman ini akan diperbarui otomatis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
