"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Wifi, Zap, RefreshCw, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { formatRupiah } from "@/lib/utils";

const PACKETS = [
  { id: "1jam", name: "1 Jam", price: 5000, duration: "1 jam" },
  { id: "3jam", name: "3 Jam", price: 10000, duration: "3 jam" },
  { id: "6jam", name: "6 Jam", price: 15000, duration: "6 jam" },
  { id: "12jam", name: "12 Jam", price: 25000, duration: "12 jam" },
  { id: "1hari", name: "1 Hari", price: 35000, duration: "24 jam" },
  { id: "3hari", name: "3 Hari", price: 80000, duration: "72 jam" },
  { id: "7hari", name: "7 Hari", price: 150000, duration: "7 hari" },
  { id: "30hari", name: "30 Hari", price: 500000, duration: "30 hari" },
];

export default function WifiPage() {
  const { data: session } = useSession();
  const [selectedPacket, setSelectedPacket] = useState<typeof PACKETS[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<{ balance: number; hold: number } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!session?.user) return;
    setBalanceLoading(true);
    try {
      const res = await fetch("/api/topup/balance");
      const json = await res.json();
      if (json.success) setBalance(json.data);
    } finally {
      setBalanceLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const handleBuy = async () => {
    if (!selectedPacket) { toast.error("Pilih paket wifi terlebih dahulu"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/wifi/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packetId: selectedPacket.id,
          packetName: selectedPacket.name,
          price: selectedPacket.price,
          duration: selectedPacket.duration,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Gagal membuat order");
        return;
      }
      if (json.data.paymentUrl) {
        window.location.href = json.data.paymentUrl;
      } else {
        toast.success("Pembelian berhasil!");
        fetchBalance();
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-blue-600 text-white py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
            <Wifi className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black mb-2">Voucher Wifi</h1>
          <p className="text-blue-100">Akses internet cepat dengan paket wifi hotspot.</p>
        </div>
      </div>

      {/* Saldo widget */}
      {session?.user && (
        <div className="bg-blue-600 text-white px-4 py-5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wide mb-1">Saldo JBB</p>
              {balanceLoading ? (
                <div className="h-7 w-32 bg-white/20 animate-pulse rounded-xl" />
              ) : (
                <p className="text-2xl font-black">{balance ? formatRupiah(balance.balance) : "Rp 0"}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchBalance}
                disabled={balanceLoading}
                className="flex items-center gap-1.5 bg-white text-blue-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" /> Pilih Paket Wifi
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {PACKETS.map((packet) => (
            <button
              key={packet.id}
              onClick={() => setSelectedPacket(packet)}
              className={`border-2 rounded-xl p-4 text-left transition-all ${
                selectedPacket?.id === packet.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <p className="font-bold text-gray-800 text-sm">{packet.name}</p>
              <p className="text-blue-600 font-black mt-1">{formatRupiah(packet.price)}</p>
              <p className="text-xs text-gray-500 mt-1">{packet.duration}</p>
            </button>
          ))}
        </div>

        {selectedPacket && (
          <div className="bg-gray-100 rounded-xl p-4 mb-4 text-sm text-gray-700">
            <div className="flex justify-between mb-1">
              <span>Paket</span>
              <span className="font-medium">{selectedPacket.name} ({selectedPacket.duration})</span>
            </div>
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-black text-blue-600">{formatRupiah(selectedPacket.price)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleBuy}
          disabled={!selectedPacket || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {loading ? "Memproses..." : "Beli Sekarang"}
        </Button>
      </div>
    </div>
  );
}

