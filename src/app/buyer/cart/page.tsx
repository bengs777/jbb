"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { Trash2, ShoppingBag, Minus, Plus, Package } from "lucide-react";

interface CartItem {
  id: string;
  qty: number;
  product_id: string;
  product_nama: string;
  product_harga: number;
  product_stok: number;
  product_foto: string | null;
  seller_id: string;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alamat, setAlamat] = useState("");
  const [namaPenerima, setNamaPenerima] = useState("");
  const [noHp, setNoHp] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchCart = useCallback(async () => {
    const res = await fetch("/api/cart");
    const json = await res.json();
    setItems(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQty = async (productId: string, qty: number) => {
    if (qty <= 0) {
      await removeItem(productId);
      return;
    }
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, qty }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => i.product_id === productId ? { ...i, qty } : i));
    }
  };

  const removeItem = async (productId: string) => {
    await fetch(`/api/cart?product_id=${productId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    toast.success("Item dihapus");
  };

  const totalProduk = items.reduce((sum, i) => sum + i.product_harga * i.qty, 0);
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const feeKurir = totalQty > 0 ? Math.ceil(totalQty / 2) * 1500 : 0;
  const feeAdmin = totalQty > 0 ? 1000 : 0;
  const totalBayar = totalProduk + feeKurir + feeAdmin;

  const handleCheckout = async () => {
    if (!namaPenerima.trim()) { toast.error("Nama penerima wajib diisi"); return; }
    if (!noHp.trim()) { toast.error("Nomor HP penerima wajib diisi"); return; }
    if (!alamat.trim()) { toast.error("Alamat pengiriman wajib diisi"); return; }
    if (items.length === 0) { toast.error("Keranjang kosong"); return; }

    setCheckingOut(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_penerima: namaPenerima,
          no_hp_penerima: noHp,
          alamat_pengiriman: alamat,
          items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Checkout gagal"); return; }

      toast.success("Order berhasil! Silakan bayar.");
      const paymentUrl: string | null = json.data?.payment_url ?? null;
      // In sandbox/mock mode payment_url is a local path — go there directly
      if (paymentUrl && paymentUrl.startsWith("/api/payment/sandbox/")) {
        window.location.href = paymentUrl;
      } else {
        router.push(`/buyer/payment/${json.data.order_id}`);
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Keranjang Belanja</h1>

        {loading ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <EmptyState
            title="Keranjang kosong"
            description="Yuk belanja dulu di katalog!"
            icon={<ShoppingBag className="h-16 w-16" />}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Items */}
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-3">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product_foto ? (
                    <Image src={item.product_foto} alt={item.product_nama} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{item.product_nama}</p>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-primary font-bold text-sm mt-0.5">{formatRupiah(item.product_harga)}<span className="text-gray-400 font-normal"> / item</span></p>
                  <div className="flex items-center justify-between mt-3">
                    {/* Qty control */}
                    <div className="flex items-center rounded-xl border-2 border-primary/20 overflow-hidden">
                      <button
                        onClick={() => updateQty(item.product_id, item.qty - 1)}
                        className="w-9 h-9 flex items-center justify-center bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors text-primary font-bold text-lg"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-base font-black text-gray-800 tabular-nums select-none">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product_id, Math.min(item.product_stok, item.qty + 1))}
                        disabled={item.qty >= item.product_stok}
                        className="w-9 h-9 flex items-center justify-center bg-primary hover:bg-primary/90 transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {formatRupiah(item.product_harga * item.qty)}
                    </span>
                  </div>
                  {item.qty >= item.product_stok && (
                    <p className="text-xs text-orange-500 mt-1">Stok maks: {item.product_stok}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Info Penerima & Alamat */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3">
              <h3 className="font-semibold text-gray-800 text-sm">Informasi Penerima</h3>
              <Input
                label="Nama Penerima"
                placeholder="Nama lengkap penerima"
                value={namaPenerima}
                onChange={(e) => setNamaPenerima(e.target.value)}
              />
              <Input
                label="Nomor HP Penerima"
                placeholder="08xxxxxxxxxx"
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
              />
              <Input
                label="Alamat Pengiriman"
                placeholder="Jl. Desa No. XX, RT/RW..."
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
              />
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Ringkasan Pembayaran</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total Produk</span>
                  <span>{formatRupiah(totalProduk)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>
                    Ongkir Kurir
                    <span className="ml-1.5 text-xs text-gray-400">({totalQty} barang)</span>
                  </span>
                  <span>{formatRupiah(feeKurir)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Admin</span>
                  <span>{formatRupiah(feeAdmin)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-800 text-base">
                  <span>Total Bayar</span>
                  <span className="text-green-700">{formatRupiah(totalBayar)}</span>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm text-primary flex items-start gap-2">
              <span className="text-lg mt-0.5">🙏</span>
              <span>Terima kasih telah berbelanja di <strong>JBB</strong>! Pesananmu sudah siap — yuk selesaikan pembayaran dan barangmu segera kami proses. 🛍️</span>
            </div>

            <Button onClick={handleCheckout} loading={checkingOut} size="lg" className="w-full">
              Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
