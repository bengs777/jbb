"use client";

import { useEffect, useState, useCallback, useDeferredValue } from "react";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/layout/navbar";
import { ProductCard } from "@/components/products/product-card";
import { Input } from "@/components/ui/input";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Semua", "Sembako", "Sayuran", "Buah", "Olahan", "Camilan", "Minuman", "Lainnya",
];

// ─── Debounce hook: delays value update until user stops typing ───
function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface Product {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  foto_url: string | null;
  kategori: string;
  seller_name: string;
}

interface Pagination {
  page: number;
  total: number;
  totalPages: number;
}

export default function KatalogPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState(() => {
    const k = searchParams.get("kategori");
    return k && CATEGORIES.includes(k) ? k : "Semua";
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350); // only fires API after 350ms idle

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (kategori !== "Semua") params.set("kategori", kategori);

      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      setProducts(json.data?.products ?? []);
      setPagination(json.data?.pagination ?? { page: 1, total: 0, totalPages: 1 });
    } catch {
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, kategori]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when search/category changes
  useEffect(() => { setPage(1); }, [debouncedSearch, kategori]);

  const handleAddToCart = async (productId: string) => {
    if (!session) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, qty: 1 }),
    });
    if (res.ok) {
      toast.success("Ditambahkan ke keranjang!");
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Gagal tambah ke keranjang");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Katalog Produk</h1>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setKategori(cat); setPage(1); }}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150",
                  kategori === cat
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-primary/30 hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState
            title="Produk tidak ditemukan"
            description="Coba ubah kata kunci atau kategori pencarian"
            icon={<Search className="h-16 w-16" />}
          />
        ) : (
          <>  
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                Menampilkan {products.length} dari {pagination.total} produk
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  {...p}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-slate-600 font-medium">
                  Halaman {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
