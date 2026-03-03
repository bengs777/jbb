"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Truck, Shield, ArrowRight, Star,
  Gamepad2, ChevronRight, ShoppingCart, Smartphone,
  Search, Zap, MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  { label: "Makanan", emoji: "🍱", key: "Olahan",   color: "from-orange-400 to-rose-500" },
  { label: "Sembako", emoji: "🛒", key: "Sembako",   color: "from-amber-400 to-orange-500" },
  { label: "Sayuran", emoji: "🥦", key: "Sayuran",   color: "from-emerald-400 to-green-600" },
  { label: "Buah",    emoji: "🍎", key: "Buah",      color: "from-red-400 to-rose-600" },
  { label: "Camilan", emoji: "🍿", key: "Camilan",   color: "from-yellow-400 to-amber-500" },
  { label: "Minuman", emoji: "🍹", key: "Minuman",   color: "from-cyan-400 to-blue-500" },
  { label: "Game",    emoji: "🎮", key: "games",     color: "from-violet-500 to-purple-700" },
  { label: "Lainnya", emoji: "📦", key: "Lainnya",   color: "from-slate-400 to-slate-600" },
];

const STATS = [
  { label: "Produk Tersedia",   value: "500+" },
  { label: "Penjual Aktif",    value: "50+" },
  { label: "Kurir Lokal",      value: "10+" },
  { label: "Warga Berbelanja", value: "200+" },
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

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [viralProducts, setViralProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=8")
      .then((r) => r.json())
      .then((j) => setViralProducts(j.data?.products ?? []))
      .catch(() => {});
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />

        <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs px-3.5 py-1.5 rounded-full mb-5 font-semibold tracking-wide">
              <MapPin className="h-3 w-3 text-yellow-300" />
              Pasar Digital Warga Desa Buntu
            </div>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight mb-4">
              Produk Asli<br />
              <span className="text-yellow-300">Desa Buntu</span>
            </h1>
            <p className="text-blue-200 text-base md:text-lg mb-7 leading-relaxed max-w-xl">
              Dari Mang, Bi, Kang, A, dan Teteh � bahan segar, olahan lezat, dan produk lokal berkualitas, langsung dari sumber.
            </p>

            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white rounded-2xl shadow-xl shadow-blue-900/20 p-1.5 mb-7 max-w-lg">
              <Search className="h-5 w-5 text-slate-400 ml-2 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk, penjual�"
                className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none py-1.5 pr-2"
              />
              <button type="submit" className="bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex-shrink-0">
                Cari
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              <Link href="/katalog" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 text-sm">
                Mulai Belanja <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm">
                Buka Toko Gratis
              </Link>
            </div>
          </div>
        </div>

        <div className="relative h-10">
          <svg viewBox="0 0 1440 40" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,40 L1440,40 L1440,0 Q720,40 0,0 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-50 pt-8 pb-2">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATS.map((s, i) => {
              const icons = [ShoppingBag, Star, Truck, ShoppingCart];
              const Icon = icons[i];
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800 leading-none">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-800 tracking-tight">Kategori</h2>
            <Link href="/katalog" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              Semua <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => handleCategory(c.key)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-full aspect-square bg-gradient-to-br ${c.color} rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-150`}>
                  {c.emoji}
                </div>
                <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-700 transition-colors">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Viral Products */}
      {viralProducts.length > 0 && (
        <section className="py-4 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">🔥 Produk Viral</h2>
                <p className="text-xs text-slate-500 mt-0.5">Paling diminati dari para penjual Desa Buntu</p>
              </div>
              <Link href="/katalog" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
                Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {viralProducts.map((p) => (
                <div key={p.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5 transition-all duration-200">
                  <Link href={`/katalog/${p.id}`} className="block">
                    <div className="relative aspect-square bg-slate-50 overflow-hidden">
                      {p.foto_url ? (
                        <Image src={p.foto_url} alt={p.nama} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="300px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl select-none">🛒</div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="bg-white/90 backdrop-blur text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                          {p.kategori}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 pb-2">
                      <p className="text-[11px] text-slate-400 font-medium mb-0.5 truncate">oleh {p.seller_name}</p>
                      <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug mb-1.5 tracking-tight">{p.nama}</p>
                      <p className="text-base font-black text-blue-700">Rp {p.harga.toLocaleString("id-ID")}</p>
                    </div>
                  </Link>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => handleAddToCart(p.id)}
                      className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Tambah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo Banners */}
      <section className="py-6 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-2xl overflow-hidden h-44 bg-gradient-to-br from-orange-400 via-orange-500 to-rose-600 p-6 flex flex-col justify-between">
            <div className="absolute right-5 top-0 h-full flex items-center pointer-events-none select-none text-8xl opacity-20">👗</div>
            <div>
              <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Koleksi Pakaian</p>
              <h3 className="text-white font-black text-xl leading-tight tracking-tight">Gaya Lokal,<br />Kualitas Terbaik</h3>
            </div>
            <Link href="/katalog?kategori=Lainnya" className="inline-flex items-center gap-1.5 bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-xl w-fit hover:bg-orange-50 transition-colors">
              Lihat Koleksi <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-44 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 p-6 flex flex-col justify-between">
            <div className="absolute right-5 top-0 h-full flex items-center pointer-events-none select-none text-8xl opacity-20">🍜</div>
            <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Kuliner Pilihan</p>
              <h3 className="text-white font-black text-xl leading-tight tracking-tight">Cita Rasa Nusantara<br />Di Meja Anda</h3>
            </div>
            <Link href="/katalog?kategori=Olahan" className="inline-flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-bold px-4 py-2 rounded-xl w-fit hover:bg-emerald-50 transition-colors">
              Pesan Sekarang <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature CTAs */}
      <section className="py-2 pb-6 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎮</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-sm tracking-tight">Game Voucher</h3>
              <p className="text-violet-200 text-xs mt-0.5">Top-up MLBB, FF, PUBG & lainnya</p>
            </div>
            <Link href="/games" className="flex-shrink-0 flex items-center gap-1.5 bg-white text-violet-700 font-bold px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors text-xs shadow-sm whitespace-nowrap">
              <Gamepad2 className="h-3.5 w-3.5" /> Beli
            </Link>
          </div>
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎮</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-sm tracking-tight">Top-Up & Pulsa</h3>
              <p className="text-sky-200 text-xs mt-0.5">Isi saldo, pulsa & paket data</p>
            </div>
            <Link href="/topup" className="flex-shrink-0 flex items-center gap-1.5 bg-white text-sky-700 font-bold px-4 py-2 rounded-xl hover:bg-sky-50 transition-colors text-xs shadow-sm whitespace-nowrap">
              <Smartphone className="h-3.5 w-3.5" /> Isi
            </Link>
          </div>
        </div>
      </section>

      {/* Why JBB */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Kenapa Pilih JBB?</h2>
            <p className="text-slate-500 text-sm">Pasar digital dengan sentuhan komunitas lokal Desa Buntu.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Shield className="h-5 w-5 text-blue-600" />,   title: "Transaksi 100% Aman",      desc: "Pembayaran terenkripsi dan terpercaya untuk kenyamanan belanja Anda.",               bg: "bg-blue-50",   ring: "ring-blue-100" },
              { icon: <Truck   className="h-5 w-5 text-emerald-600" />, title: "Kurir Lokal Terpercaya",   desc: "Kurir warga yang mengenal area Buntu � pengiriman lebih personal dan cepat.",     bg: "bg-emerald-50", ring: "ring-emerald-100" },
              { icon: <Zap     className="h-5 w-5 text-orange-500" />, title: "Produk Berkualitas",        desc: "Semua penjual terverifikasi dan produk dikurasi untuk kualitas terbaik.",           bg: "bg-orange-50",  ring: "ring-orange-100" },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:shadow-slate-100 transition-all duration-200 group">
                <div className={`w-10 h-10 ${f.bg} ring-1 ${f.ring} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-800 mb-1.5 tracking-tight text-sm">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-7">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Cara Berbelanja</h2>
            <p className="text-sm text-slate-500 mt-1">Mudah, cepat, dan aman dalam 4 langkah.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { step: "01", emoji: "🔍", title: "Pilih Produk",     desc: "Browse katalog dari seller Buntu." },
              { step: "02", emoji: "🛒", title: "Tambah Keranjang", desc: "Masukkan produk ke keranjang." },
              { step: "03", emoji: "💳", title: "Bayar Mudah",      desc: "Scan QRIS atau transfer." },
              { step: "04", emoji: "🛵", title: "Kurir Antar",      desc: "Kurir lokal antar ke rumah." },
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {i < 3 && <div className="hidden md:block absolute top-6 left-[calc(50%+26px)] right-0 border-t-2 border-dashed border-slate-200" />}
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl mb-3 shadow-lg shadow-blue-200/70 z-10 relative">
                  {s.emoji}
                </div>
                <span className="text-[10px] font-black text-blue-600 mb-1 tracking-widest">{s.step}</span>
                <h3 className="font-bold text-slate-800 mb-1 tracking-tight text-sm">{s.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-14 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">🏔</div>
          <h2 className="text-3xl font-black mb-3 tracking-tight">Siap Mulai Belanja?</h2>
          <p className="text-blue-200 mb-7 text-base">Bergabung dengan ratusan warga Buntu yang sudah berbelanja dan berjualan di JBB.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/katalog" className="bg-white text-blue-700 font-bold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 text-sm">
              Lihat Katalog
            </Link>
            <Link href="/register" className="bg-white/10 border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm">
              Buat Akun Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2 mb-3">
                <Image src="/logo.png" alt="JBB" width={36} height={36} />
                <span className="text-white font-black text-lg tracking-tight">JBB</span>
              </Link>
              <p className="text-sm leading-relaxed mb-3 max-w-xs">
                Jual Beli Buntu � pasar digital warga yang menghadirkan hasil panen, olahan, dan produk kreatif asli Desa Buntu.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3 w-3" /> Desa Buntu, Indonesia
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3 text-sm tracking-tight">Belanja</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/katalog"                  className="hover:text-white transition-colors">Semua Produk</Link></li>
                <li><Link href="/katalog?kategori=Olahan"  className="hover:text-white transition-colors">Makanan</Link></li>
                <li><Link href="/games"                    className="hover:text-white transition-colors">Game Voucher</Link></li>
                <li><Link href="/topup"                    className="hover:text-white transition-colors">Top-Up Pulsa</Link></li>
                <li><Link href="/buyer/orders"             className="hover:text-white transition-colors">Lacak Pesanan</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3 text-sm tracking-tight">Jual di JBB</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register"  className="hover:text-white transition-colors">Daftar Penjual</Link></li>
                <li><Link href="/seller"    className="hover:text-white transition-colors">Dashboard Seller</Link></li>
                <li><Link href="/kurir"     className="hover:text-white transition-colors">Jadi Kurir</Link></li>
                <li><Link href="/settings"  className="hover:text-white transition-colors">Pengaturan Akun</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3 text-sm tracking-tight">Kabar Terbaru</h4>
              <p className="text-xs mb-3 leading-relaxed">Daftar untuk mendapat info panen & produk baru dari Desa Buntu.</p>
              <form onSubmit={(e) => { e.preventDefault(); toast.success("Terima kasih sudah daftar!"); }} className="flex gap-2">
                <input type="email" placeholder="Email kamu" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 min-w-0" />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex-shrink-0">Daftar</button>
              </form>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs">� {new Date().getFullYear()} JBB Desa Buntu � Pasar Digital Warga</p>
            <div className="flex gap-4 text-xs">
              <Link href="/katalog" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
              <Link href="/katalog" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
