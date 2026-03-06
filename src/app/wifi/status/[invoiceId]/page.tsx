"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Wifi, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface OrderData {
  status: "WAITING_PAYMENT" | "PAID" | "FAILED";
  packet_name: string;
  duration: string;
  voucher_username?: string;
  voucher_password?: string;
  amount: number;
}

export default function WifiStatusPage() {
  const { invoiceId } = useParams() as { invoiceId: string };
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/wifi/status/${invoiceId}`);
        const json = await res.json();
        if (json.success) setOrder(json.data);
      } catch (error) {
        console.error("Failed to fetch status", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa status pembayaran...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Invoice ID tidak valid atau sudah kadaluarsa.</p>
          <Link href="/wifi">
            <Button>Kembali ke Voucher Wifi</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          {order.status === "PAID" ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h1>
              <p className="text-gray-600 mb-6">Voucher wifi Anda sudah siap digunakan.</p>

              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <Wifi className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-600">{order.packet_name}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{order.duration}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Username</p>
                    <p className="font-mono text-sm bg-white px-2 py-1 rounded border">{order.voucher_username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Password</p>
                    <p className="font-mono text-sm bg-white px-2 py-1 rounded border">{order.voucher_password}</p>
                  </div>
                </div>
              </div>
            </>
          ) : order.status === "FAILED" ? (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Gagal</h1>
              <p className="text-gray-600 mb-6">Terjadi kesalahan saat memproses pembayaran.</p>
            </>
          ) : (
            <>
              <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Menunggu Pembayaran</h1>
              <p className="text-gray-600 mb-6">Silakan selesaikan pembayaran di aplikasi Mayar.id.</p>
            </>
          )}

          <div className="space-y-3">
            <Link href="/wifi">
              <Button variant="outline" className="w-full">
                Beli Voucher Lain
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full">Kembali ke Beranda</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}