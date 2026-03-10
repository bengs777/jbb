"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Truck, Shield, ArrowRight,
  Gamepad2, ChevronRight, ShoppingCart, Smartphone,
  Search, MapPin, Leaf,
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  { label: "Makanan",  emoji: "🍛", key: "Olahan"  },
  { label: "Sembako",  emoji: "🌾", key: "Sembako" },
  { label: "Sayuran",  emoji: "🥬", key: "Sayuran" },
  { label: "Buah",     emoji: "🍊", key: "Buah"    },
  { label: "Camilan",  emoji: "🍪", key: "Camilan" },
  { label: "Kopi",     emoji: "☕", key: "Minuman" },
  { label: "Game",     emoji: "🎮", key: "games"   },
  { label: "Lainnya",  emoji: "🧺", key: "Lainnya" },
];

const STATS = [
  { emoji: "🌾", value: "500+",  label: "Produk Lokal"   },
  { emoji: "🏘️", value: "50+",   label: "Penjual Warga"  },
  { emoji: "🛵", value: "10+",   label: "Kurir Kampung"  },
  { emoji: "🤝", value: "200+",  label: "Pembeli Aktif"  },
];

interface Product {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  foto_url: string | null;
  kategori: string;
  seller_name: string;
}

// Foto: Petani & Pedagang Asongan Jawa Barat
const UMKM_STORIES = [
  {
    // Petani di sawah — nuansa Jawa Barat, ladang hijau
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=900&q=80",
    title: "Petani Buntu Bercerita",
    subtitle: "Langsung dari Sawah",
    description: "Pak Asep turun ke sawah sebelum subuh. Panennya hari ini — sudah bisa kamu pesan sekarang.",
  },
  {
    // Pedagang asongan / kaki lima — pasar desa khas Sunda
    image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=900&q=80",
    title: "Pedagang Asongan Desa",
    subtitle: "UMKM Pinggir Jalan",
    description: "Dari gerobak kayu di pinggir jalan, kini dagangannya hadir di JBB. Pesan, diantar ke rumah.",
  },
] as const;

export default function HomePage() {
  const { data: session } = useSession();
  const role = session?.user?.role as string;
  const router = useRouter();
  const [viralProducts, setViralProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [activeStory, setActiveStory] = useState(0);

  useEffect(() => {
    fetch("/api/products?limit=8")
      .then((r) => r.json())
      .then((j) => setViralProducts(j.data?.products ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStory((prev) => (prev + 1) % UMKM_STORIES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = async (productId: string) => {
    if (!session) { router.push("/login"); return; }
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, qty: 1 }),
    });
    if (res.ok) toast.success("Ditambahkan ke keranjang!");
    else toast.error("Gagal tambah ke keranjang");
  };

  const handleCategory = (key: string) => {
    if (key === "games") { router.push("/games"); return; }
    router.push(`/katalog?kategori=${encodeURIComponent(key)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/katalog?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      {/*
        Foto: Sawah berundak / pesawahan luas Jawa Barat
        photo-1537953773345 = Tegallalang Bali rice terraces (representasi pesawahan Indonesia)
      */}
      <section
        className="relative overflow-hidden min-h-[420px] sm:min-h-[520px] md:min-h-[580px] flex items-center"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1537953773345-d172ccf13cf4?w=1400&q=85)",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        {/* Overlay: kiri gelap agar teks terbaca, kanan transparan agar foto terlihat */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/15" />

        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-16 md:py-24 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

            {/* ── Kiri: Teks ─────────────────────────────────────── */}
            <div>
              {/* Pill label */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium mb-4 sm:mb-6">
                <span>🌾</span>
                <MapPin className="h-3 sm:h-3.5 w-3 sm:w-3.5 opacity-75" />
                <span className="hidden sm:inline">Pasar Digital · Desa Buntu</span>
                <span className="sm:hidden">Pasar Digital Buntu</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-3 sm:mb-5">
                Dari Kebun Warga,<br />
                <span className="relative inline-block mt-1">
                  <span className="relative z-10 text-white">Langsung ke Dapur.</span>
                  <span className="absolute inset-x-0 bottom-0.5 sm:bottom-1 h-2 sm:h-3 bg-primary/70 -z-0 rounded" />
                </span>
              </h1>

              <p className="text-white/85 text-xs sm:text-base md:text-lg mb-4 sm:mb-8 leading-relaxed max-w-md">
                Sayuran, olahan, dan produk UMKM dari warga Buntu sendiri. Harga jujur, diantar kurir orang kampung.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg sm:rounded-xl shadow-lg mb-4 sm:mb-8 max-w-md overflow-hidden w-full sm:w-auto" suppressHydrationWarning={true}>
                <Search className="h-4 sm:h-5 w-4 sm:w-5 text-stone-400 ml-3 sm:ml-4 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk…"
                  className="flex-1 px-2 sm:px-3 py-2.5 sm:py-3.5 text-xs sm:text-sm text-stone-800 bg-transparent focus:outline-none placeholder:text-stone-400"
                  suppressHydrationWarning={true}
                />
                <button type="submit" className="bg-primary text-white px-4 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors flex-shrink-0" suppressHydrationWarning={true}>
                  Cari
                </button>
              </form>

              {/* CTA buttons */}
              <div className="flex flex-col xs:flex-row gap-3 w-full xs:w-auto">
                <Link href="/katalog" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg sm:rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 text-xs sm:text-sm">
                  Belanja <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm border border-white/40 text-white font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg sm:rounded-xl hover:bg-white/25 transition-colors text-xs sm:text-sm">
                  🏪 Buka Toko
                </Link>
                {role === "ADMIN" && (
                  <Link href="/admin" className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg sm:rounded-xl hover:bg-amber-600 transition-colors text-xs sm:text-sm">
                    📊 Dashboard Admin
                  </Link>
                )}
              </div>
            </div>

            {/* ── Kanan: Story card ───────────────────────────────── */}
            <div className="hidden md:block">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={UMKM_STORIES[activeStory].image}
                    alt={UMKM_STORIES[activeStory].title}
                    fill
                    className="object-cover transition-opacity duration-700"
                    sizes="42vw"
                    priority
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-bold mb-1">
                    {UMKM_STORIES[activeStory].subtitle}
                  </p>
                  <p className="text-white text-lg font-bold leading-tight">
                    {UMKM_STORIES[activeStory].title}
                  </p>
                  <p className="text-white/75 text-xs mt-1 leading-relaxed">
                    {UMKM_STORIES[activeStory].description}
                  </p>
                </div>
                {/* dot indicators */}
                <div className="absolute top-4 right-4 flex gap-1.5">
                  {UMKM_STORIES.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => setActiveStory(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === activeStory ? "w-7 bg-amber-300" : "w-2 bg-white/50 hover:bg-white/80"}`}
                      aria-label={`Tampilkan ${s.title}`}
                      suppressHydrationWarning={true}
                    />
                  ))}
                </div>
              </div>

              {/* mini thumbnail tabs */}
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {UMKM_STORIES.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => setActiveStory(i)}
                    className={`text-left rounded-xl px-3.5 py-2.5 border transition-all text-sm ${
                      i === activeStory
                        ? "bg-white text-primary border-white/80 shadow-md"
                        : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                    }`}
                    suppressHydrationWarning={true}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-70">{s.subtitle}</p>
                    <p className="font-bold text-xs leading-tight">{s.title}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-stone-100">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center py-4 sm:py-8 gap-0.5 sm:gap-1 text-center">
                <span className="text-lg sm:text-2xl mb-0.5 sm:mb-1">{s.emoji}</span>
                <span className="text-xl sm:text-3xl font-black text-primary tracking-tight">{s.value}</span>
                <span className="text-[10px] sm:text-xs text-stone-500 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kategori ─────────────────────────────────────────────── */}
      <section className="py-8 sm:py-10 md:py-14 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-1">Mau Beli Apa?</p>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-stone-800 tracking-tight">Pilih Kategori</h2>
            </div>
            <Link href="/katalog" className="text-xs sm:text-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1">
              Semua <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-1.5 sm:gap-2 md:gap-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => handleCategory(c.key)}
                className="group flex flex-col items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-white hover:shadow-md transition-all duration-200"
                suppressHydrationWarning={true}
              >
                <div className="w-10 sm:w-14 h-10 sm:h-14 bg-white group-hover:bg-primary rounded-lg sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl shadow-sm group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-200">
                  {c.emoji}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-stone-600 group-hover:text-primary transition-colors text-center leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tiga Keunggulan ──────────────────────────────────────── */}
      <section className="py-8 sm:py-12 bg-white border-y border-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: <Leaf className="h-5 w-5 text-green-600" />,
                bg: "bg-green-50",
                accent: "text-green-700",
                title: "Langsung dari Sumber",
                desc: "Tidak ada pengepul. Harga lebih jujur, hasil panen lebih segar.",
              },
              {
                icon: <Truck className="h-5 w-5 text-primary" />,
                bg: "bg-primary/10",
                accent: "text-primary",
                title: "Kurir Orang Desa",
                desc: "Kurir warga yang hafal gang-gang kecil dan nama warga di Buntu.",
              },
              {
                icon: <Shield className="h-5 w-5 text-amber-600" />,
                bg: "bg-amber-50",
                accent: "text-amber-700",
                title: "Bayar QRIS, Aman",
                desc: "Scan, bayar, selesai. Tanpa tunai, tanpa ribet, 100% aman.",
              },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-5 rounded-lg sm:rounded-2xl border border-stone-100 hover:shadow-md transition-shadow duration-200 group">
                <div className={`w-9 sm:w-11 h-9 sm:h-11 ${f.bg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className={`font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 ${f.accent}`}>{f.title}</h3>
                  <p className="text-stone-500 text-[10px] sm:text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Produk Terlaris ──────────────────────────────────────── */}
      {viralProducts.length > 0 && (
        <section className="py-8 sm:py-10 md:py-14 bg-amber-50/40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-1">Paling Dicari Warga</p>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-stone-800 tracking-tight">🔥 Produk Terlaris</h2>
              </div>
              <Link href="/katalog" className="btn-primary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                Lihat Semua <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {viralProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 group border border-stone-100">
                  <Link href={`/katalog/${p.id}`} className="block">
                    <div className="relative aspect-square bg-stone-100 overflow-hidden">
                      {p.foto_url ? (
                        <Image
                          src={p.foto_url}
                          alt={p.nama}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="300px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
                      )}
                      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-semibold text-primary px-2 py-0.5 rounded-full shadow-sm">
                        {p.kategori}
                      </span>
                    </div>
                    <div className="p-3 pb-0">
                      <p className="text-[10px] text-stone-400 font-medium truncate mb-0.5">oleh {p.seller_name}</p>
                      <p className="text-sm font-bold text-stone-800 line-clamp-2 leading-snug mb-2">{p.nama}</p>
                      <p className="text-base font-black text-primary">Rp {p.harga.toLocaleString("id-ID")}</p>
                    </div>
                  </Link>
                  <div className="p-3 pt-2">
                    <button
                      onClick={() => handleAddToCart(p.id)}
                      className="w-full bg-primary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      suppressHydrationWarning={true}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Tambah ke Keranjang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Banner Promo ─────────────────────────────────────────── */}
      {/*
        Banner 1: Anyaman / kerajinan bambu Sunda
        photo-1602143407151 = woven handicraft, cocok untuk kerajinan Jabar
        Banner 2: Masakan Sunda — nasi + lauk
        photo-1565299585323 = rice plate with toppings, nuansa nasi timbel
      */}
      <section className="py-8 sm:py-10 md:py-14 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-4 sm:mb-6">
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-1">Unggulan Desa</p>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-stone-800 tracking-tight">Pilihan Istimewa</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
            {/* Banner 1 — Petani & Hasil Panen */}
            <div
              className="relative rounded-lg sm:rounded-2xl overflow-hidden h-36 sm:h-48 md:h-56"
              style={{
                backgroundImage: "url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/35" />
              <div className="relative p-4 sm:p-7 h-full flex flex-col justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-300 block mb-1 sm:mb-2">
                    Langsung dari Petani
                  </span>
                  <h3 className="text-white font-black text-sm sm:text-2xl leading-tight">
                    Panen Langsung Dijual,<br />
                    <span className="text-amber-200">Harga Petani</span>
                  </h3>
                </div>
                <Link
                  href="/katalog?kategori=Lainnya"
                  className="inline-flex items-center gap-1 sm:gap-2 bg-white text-primary font-bold px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl w-fit text-xs sm:text-sm hover:bg-stone-50 transition-colors shadow-md"
                >
                  Lihat <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4" />
                </Link>
              </div>
            </div>

            {/* Banner 2 — Pedagang Asongan / Jajanan Kaki Lima */}
            <div
              className="relative rounded-lg sm:rounded-2xl overflow-hidden h-36 sm:h-48 md:h-56"
              style={{
                backgroundImage: "url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-900/95 via-amber-800/80 to-amber-700/35" />
              <div className="relative p-4 sm:p-7 h-full flex flex-col justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-300 block mb-1 sm:mb-2">
                    Pedagang Asongan Buntu
                  </span>
                  <h3 className="text-white font-black text-sm sm:text-2xl leading-tight">
                    Jajanan Pinggir Jalan,<br />
                    <span className="text-amber-200">Pesan Online</span>
                  </h3>
                </div>
                <Link
                  href="/katalog?kategori=Olahan"
                  className="inline-flex items-center gap-1 sm:gap-2 bg-white text-amber-800 font-bold px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl w-fit text-xs sm:text-sm hover:bg-stone-50 transition-colors shadow-md"
                >
                  Pesan <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Layanan Digital ──────────────────────────────────────── */}
      <section className="py-8 sm:py-12 bg-white border-y border-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-1">Selain Belanja</p>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-stone-800 tracking-tight">Ada Juga Ini</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg sm:rounded-2xl border border-stone-100 hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-primary/10 rounded-lg sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 group-hover:bg-primary transition-colors duration-200">
                🎮
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-800 text-xs sm:text-sm mb-0.5">Game Voucher</h3>
                <p className="text-stone-500 text-[10px] sm:text-xs">Top-up MLBB, FF, PUBG +</p>
              </div>
              <Link href="/games" className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5 bg-primary text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-primary/90 transition-colors min-h-[32px] sm:min-h-[36px]">
                <Gamepad2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Beli
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg sm:rounded-2xl border border-stone-100 hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-primary/10 rounded-lg sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 group-hover:bg-primary transition-colors duration-200">
                📱
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-800 text-xs sm:text-sm mb-0.5">Pulsa & Data</h3>
                <p className="text-stone-500 text-[10px] sm:text-xs">Isi pulsa, paket data, listrik</p>
              </div>
              <Link href="/topup" className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5 bg-primary text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-primary/90 transition-colors min-h-[32px] sm:min-h-[36px]">
                <Smartphone className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Isi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cara Belanja ─────────────────────────────────────────── */}
      <section className="py-8 sm:py-10 md:py-14 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-1">Gampang Banget</p>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-stone-800 tracking-tight">Belanja Semudah Ngobrol di Warung</h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-2">4 langkah, pesanan di tangan kamu.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { step: "01", emoji: "🔍", title: "Pilih Produk",     desc: "Ratusan produk warga" },
              { step: "02", emoji: "🛒", title: "Keranjang",   desc: "Tambah yang diinginkan" },
              { step: "03", emoji: "📲", title: "QRIS & Bayar",     desc: "Scan, bayar, aman" },
              { step: "04", emoji: "🛵", title: "Diantar", desc: "Kurir ke rumah kamu" },
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {i < 3 && (
                  <div className="hidden md:block absolute top-5 sm:top-7 left-[calc(50%+24px)] sm:left-[calc(50%+32px)] right-0 border-t-2 border-dashed border-stone-200" />
                )}
                <div className="w-10 sm:w-14 h-10 sm:h-14 bg-primary text-white rounded-lg sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl mb-2 sm:mb-3 shadow-lg shadow-primary/25 z-10 relative">
                  {s.emoji}
                </div>
                <span className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest mb-0.5 sm:mb-1">{s.step}</span>
                <h3 className="font-bold text-stone-800 text-xs sm:text-sm mb-0.5 sm:mb-1">{s.title}</h3>
                <p className="text-stone-500 text-[10px] sm:text-xs leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────── */}
      {/*
        Foto: Pesawahan luas dari atas — hamparan hijau khas Jawa Barat
        photo-1464822759023 = aerial green fields / rice paddy landscape
      */}
      <section
        className="py-10 sm:py-16 text-white relative overflow-hidden"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 to-amber-900/90" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="text-3xl sm:text-5xl mb-3 sm:mb-4">🌾</div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black mb-2 sm:mb-3 tracking-tight leading-tight">
            Dukung Warga Buntu,<br />Belanja Hari Ini.
          </h2>
          <p className="text-white/80 mb-6 sm:mb-8 text-xs sm:text-base leading-relaxed">
            Setiap pembelian menghidupi petani, ibu rumah tangga, dan pengrajin
            lokal Desa Buntu secara langsung.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link
              href="/katalog"
              className="bg-white text-primary font-bold px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl hover:bg-amber-50 transition-colors shadow-xl shadow-black/15 text-xs sm:text-sm"
            >
              Lihat Katalog
            </Link>
            <Link
              href="/register"
              className="bg-white/10 border border-white/35 text-white font-semibold px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl hover:bg-white/20 transition-colors text-xs sm:text-sm"
            >
              Buka Toko
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-stone-900 text-stone-400">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
                <Image src="/logo.png" alt="JBB" width={36} height={36} className="rounded-lg" />
                <div>
                  <p className="text-white font-black text-base leading-none tracking-tight">JBB</p>
                  <p className="text-stone-500 text-[10px] leading-none mt-0.5">Jual Beli Buntu</p>
                </div>
              </Link>
              <p className="text-xs leading-relaxed mb-4 max-w-xs text-stone-500">
                Pasar digital warga Desa Buntu. Menghadirkan hasil panen, olahan, dan produk UMKM asli kampung ke seluruh pelosok desa.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <MapPin className="h-3 w-3" /> Desa Buntu, Jawa Barat
              </div>
            </div>

            {/* Belanja */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm tracking-tight">Belanja</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/katalog"                 className="hover:text-white transition-colors">Semua Produk</Link></li>
                <li><Link href="/katalog?kategori=Olahan" className="hover:text-white transition-colors">Makanan & Olahan</Link></li>
                <li><Link href="/games"                   className="hover:text-white transition-colors">Game Voucher</Link></li>
                <li><Link href="/topup"                   className="hover:text-white transition-colors">Top-Up Pulsa</Link></li>
                <li><Link href="/buyer/orders"            className="hover:text-white transition-colors">Lacak Pesanan</Link></li>
              </ul>
            </div>

            {/* Jual */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm tracking-tight">Jual di JBB</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link href="/register" className="hover:text-white transition-colors">Daftar Jadi Penjual</Link></li>
                <li><Link href="/seller"   className="hover:text-white transition-colors">Dashboard Toko</Link></li>
                <li><Link href="/kurir"    className="hover:text-white transition-colors">Bergabung Jadi Kurir</Link></li>
                <li><Link href="/settings" className="hover:text-white transition-colors">Pengaturan Akun</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm tracking-tight">Info Panen Terbaru</h4>
              <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                Mau tahu kapan sayur segar atau olahan baru tersedia? Daftar dulu.
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); toast.success("Terima kasih sudah daftar!"); }}
                className="flex gap-2"
                suppressHydrationWarning={true}
              >
                <input
                  type="email"
                  placeholder="Email kamu"
                  className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-primary min-w-0 transition-colors"
                  suppressHydrationWarning={true}
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex-shrink-0"
                  suppressHydrationWarning={true}
                >
                  Daftar
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-stone-600">© {new Date().getFullYear()} JBB · Pasar Digital Desa Buntu</p>
            <div className="flex gap-5 text-xs">
              <Link href="/katalog" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
              <Link href="/katalog" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
