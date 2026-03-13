"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { formatRupiah, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { ShoppingCart, Store, ArrowLeft, Package, Minus, Plus } from "lucide-react";

interface Product {
  id: string;
  nama: string;
  deskripsi: string | null;
  harga: number;
  stok: number;
  kategori: string;
  foto_url: string | null;
  status: string;
  seller_id: string;
  seller_name: string;
  created_at: string;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.data))
      .catch(() => toast.error("Gagal memuat produk"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!session) { router.push("/login"); return; }
    const role = (session.user as { role?: string }).role;
    if (role !== "BUYER") { toast.error("Hanya pembeli yang bisa tambah keranjang"); return; }

    setAddingToCart(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id, qty }),
      });
      if (res.ok) {
        toast.success("Ditambahkan ke keranjang!");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Gagal tambah ke keranjang");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><PageLoader /></div>;
  if (!product) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center py-20 text-gray-500">Produk tidak ditemukan</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-72 md:h-auto bg-gray-100 min-h-64">
              {product.foto_url ? (
                <Image src={product.foto_url} alt={product.nama} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>

            {/* Detail */}
            <div className="p-6 flex flex-col">
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full w-fit mb-3">
                {product.kategori}
              </span>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.nama}</h1>
              <p className="text-3xl font-black text-green-700 mb-4">
                {formatRupiah(product.harga)}
              </p>

              {product.deskripsi && (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {product.deskripsi}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Store className="h-4 w-4" />
                <span>Oleh <strong>{product.seller_name}</strong></span>
              </div>

              <div className="text-sm text-gray-500 mb-6">
                Stok:{" "}
                <span className={`font-semibold ${product.stok > 0 ? "text-green-700" : "text-red-600"}`}>
                  {product.stok > 0 ? `${product.stok} tersedia` : "Habis"}
                </span>
              </div>

              {product.stok > 0 && (
                <>
                  {/* Qty selector */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-medium text-gray-700">Jumlah:</span>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-4 py-2 text-sm font-semibold tabular-nums border-x border-gray-200">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty((q) => Math.min(product.stok, q + 1))}
                        className="px-3 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">
                      = {formatRupiah(product.harga * qty)}
                    </span>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    loading={addingToCart}
                    size="lg"
                    className="w-full"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Tambah ke Keranjang
                  </Button>
                </>
              )}

              {product.stok === 0 && (
                <div className="bg-red-50 text-red-700 text-center py-3 rounded-xl font-semibold text-sm">
                  Stok Habis
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4">
                Ditambahkan {formatDate(product.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
