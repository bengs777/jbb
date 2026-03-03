"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { CheckCircle, Clock, XCircle, Gamepad2 } from "lucide-react";
import Link from "next/link";

interface GameOrder {
  invoice_id: string;
  game_name: string;
  nominal_label: string;
  target_user_id: string;
  target_server_id?: string | null;
  amount: number;
  status: string;
  mayar_paid_at?: string | null;
  created_at?: string | null;
}

export default function GameStatusPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [order, setOrder] = useState<GameOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/games/status/${invoiceId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setOrder(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll tiap 3 detik sampai PAID/FAILED/EXPIRED (maks 20x = 60 detik)
    const interval = setInterval(() => {
      setPollCount((c) => {
        if (c >= 20) { clearInterval(interval); return c; }
        fetchStatus();
        return c + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const isPaid = order?.status === "PAID";
  const isFailed = order?.status === "FAILED" || order?.status === "EXPIRED";
  const isPending = !isPaid && !isFailed;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center animate-pulse">
              <Gamepad2 className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-gray-500">Mengecek status pembayaran…</p>
          </div>
        ) : isPaid ? (
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-green-700 mb-1">Pembayaran Berhasil!</h1>
            <p className="text-gray-500 text-sm mb-6">Voucher sedang diproses untuk akun Anda.</p>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Game</span>
                <span className="font-semibold">{order.game_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nominal</span>
                <span className="font-semibold">{order.nominal_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">User ID</span>
                <span className="font-semibold">{order.target_user_id}{order.target_server_id ? `/${order.target_server_id}` : ""}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500">Total</span>
                <span className="font-black text-purple-700">Rp {order.amount.toLocaleString("id-ID")}</span>
              </div>
            </div>
            <Link href="/games" className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition text-sm">
              Beli Lagi
            </Link>
          </div>
        ) : isFailed ? (
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-red-600 mb-1">
              {order?.status === "EXPIRED" ? "Pembayaran Kedaluwarsa" : "Pembayaran Gagal"}
            </h1>
            <p className="text-gray-500 text-sm mb-6">Silakan buat order baru.</p>
            <Link href="/games" className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition text-sm">
              Coba Lagi
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/[.04] p-8">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-9 h-9 text-yellow-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-yellow-700 mb-1">Menunggu Pembayaran</h1>
            <p className="text-gray-500 text-sm mb-4">Selesaikan pembayaran di halaman Mayar. Halaman ini akan update otomatis.</p>
            {order && (
              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice</span>
                  <span className="font-mono text-xs text-gray-700">{invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-black text-purple-700">Rp {order.amount.toLocaleString("id-ID")}</span>
                </div>
              </div>
            )}
            <Link href="/games" className="text-sm text-purple-600 hover:underline">
              Batal &amp; Kembali ke Games
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
