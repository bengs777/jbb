"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

export default function SellerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    fetch("/api/seller/products")
      .then(r => r.json())
      .then(d => setProducts(d.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const r = await fetch(`/api/seller/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (r.ok) {
      toast.success(`Produk ${newStatus === "ACTIVE" ? "diaktifkan" : "dinonaktifkan"}`);
      fetchProducts();
    } else toast.error("Gagal mengubah status");
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    const r = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("Produk dihapus");
      fetchProducts();
    } else {
      const d = await r.json();
      toast.error(d.error || "Gagal menghapus");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Produk Saya</h1>
          <Link href="/seller/products/new">
            <Button size="sm"><Plus className="h-4 w-4" /> Tambah</Button>
          </Link>
        </div>

        {loading ? <PageLoader /> : products.length === 0 ? (
          <EmptyState
            title="Belum ada produk"
            description="Mulai jual produk Anda di JBB"
            action={<Link href="/seller/products/new"><Button>Tambah Produk</Button></Link>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
                {p.foto_url && (
                  <img src={p.foto_url} alt={p.nama} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 truncate">{p.nama}</h3>
                      <p className="text-sm text-gray-500">{p.kategori}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="font-bold text-green-700">{formatRupiah(p.harga)}</span>
                    <span className="text-gray-400">Stok: {p.stok}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => toggleStatus(p.id, p.status)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${p.status === "ACTIVE" ? "border-gray-200 text-gray-600 hover:bg-gray-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}>
                      {p.status === "ACTIVE" ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {p.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <Link href={`/seller/products/${p.id}/edit`}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors">
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <button onClick={() => deleteProduct(p.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
            </div>
        )}
      </div>
    </div>
  );
}
