import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { desc, eq } from "drizzle-orm";
import { 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  Heart, 
  Search, 
  ChevronRight, 
  Star,
  Award,
  Zap,
  Store,
  MapPin,
  Clock,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const allProducts = await db.query.products.findMany({
    where: category ? eq(products.category, category) : undefined,
    orderBy: [desc(products.createdAt)],
    limit: 10,
    with: {
      seller: {
        columns: {
          name: true,
          id: true,
          image: true,
        },
      },
    },
  });

  const categories = [
    { name: "Makanan", icon: "🍱", color: "bg-red-100 text-red-600" },
    { name: "Pakaian", icon: "👕", color: "bg-blue-100 text-blue-600" },
    { name: "Kerajinan", icon: "🏺", color: "bg-amber-100 text-amber-600" },
    { name: "Minuman", icon: "🍹", color: "bg-teal-100 text-teal-600" },
    { name: "Elektronik", icon: "📱", color: "bg-purple-100 text-purple-600" },
    { name: "Kesehatan", icon: "💊", color: "bg-green-100 text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      
      {/* Search Header for Mobile */}
      <div className="bg-orange-600 p-4 md:hidden">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input className="h-10 border-none bg-white pl-10 text-sm focus-visible:ring-0" placeholder="Cari produk UMKM..." />
         </div>
      </div>

      {/* Hero Banner Section */}
      {!category && (
        <section className="relative overflow-hidden bg-orange-600 pb-16 pt-12 text-white md:pb-24 md:pt-20">
          <div className="container relative z-10 mx-auto px-4">
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="flex-1 space-y-6 text-center lg:text-left">
                <Badge className="bg-white/20 text-white border-none hover:bg-white/30 text-sm py-1 px-4">
                  🎉 Dukung Produk Dalam Negeri
                </Badge>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
                  Bawa UMKM Lokal Ke <span className="text-orange-200">Genggaman Anda</span>
                </h1>
                <p className="max-w-xl text-lg text-orange-50 opacity-90 md:text-xl">
                  Platform marketplace terpercaya yang menghubungkan Anda langsung dengan pengrajin dan produsen UMKM lokal terbaik.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-6 text-lg font-bold shadow-xl">
                    Mulai Belanja
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-bold">
                    Buka Toko
                  </Button>
                </div>
              </div>
              <div className="hidden lg:block flex-1">
                <div className="relative h-[400px] w-full">
                  <Image 
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" 
                    alt="UMKM Produk" 
                    fill 
                    className="rounded-2xl object-cover shadow-2xl ring-8 ring-white/10"
                  />
                  <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-6 shadow-xl">
                     <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                          <Award className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">100% Produk Asli</p>
                          <p className="text-xs text-gray-500">Terverifikasi UMKM Kita</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-[500px] w-[500px] rounded-full bg-orange-500/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-[500px] w-[500px] rounded-full bg-orange-700/30 blur-3xl" />
        </section>
      )}

      {/* Categories Grid */}
      <section className={`container mx-auto px-4 ${category ? 'pt-8' : '-mt-10'} relative z-20`}>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 bg-white p-6 rounded-2xl shadow-xl border">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              href={category === cat.name ? "/" : `/?category=${cat.name}`} 
              className={`group flex flex-col items-center gap-3 text-center transition-all ${category === cat.name ? 'scale-105' : 'hover:scale-105'}`}
            >
              <div className={`h-16 w-16 rounded-2xl ${category === cat.name ? 'bg-orange-600 text-white' : cat.color} flex items-center justify-center text-3xl transition-all shadow-sm`}>
                {cat.icon}
              </div>
              <span className={`text-sm font-bold ${category === cat.name ? 'text-orange-600' : 'text-gray-700 group-hover:text-orange-600'}`}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 space-y-16">
        
        {/* Featured Section */}
        <section id="products">
          <div className="mb-8 flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                {category ? `Produk: ${category}` : "Lagi Viral Hari Ini 🔥"}
              </h2>
              <p className="text-muted-foreground">
                {category ? `Menampilkan produk dari kategori ${category}` : "Produk UMKM yang paling banyak dicari saat ini."}
              </p>
            </div>
            {category && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/" className="flex items-center gap-2">
                  <X className="h-4 w-4" /> Hapus Filter
                </Link>
              </Button>
            )}
            {!category && (
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700 font-bold group">
                Lihat Semua <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
          </div>

          {allProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed">
              <ShoppingBag className="mb-4 h-16 w-16 text-gray-200" />
              <h3 className="text-xl font-medium text-gray-600">Produk sedang disiapkan</h3>
              <p className="text-gray-500">UMKM kami sedang menyiapkan koleksi terbaik untuk Anda.</p>
            </div>
          )}
        </section>

        {/* Banner Promo Section */}
        {!category && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative h-[240px] rounded-3xl overflow-hidden group">
              <Image 
                src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80" 
                alt="Fashion Lokal" 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-3 bg-white text-black font-bold">Koleksi Pakaian</Badge>
                <h3 className="text-3xl font-bold text-white mb-2">Gaya Lokal,<br/>Kualitas Internasional</h3>
                <Button asChild size="sm" className="w-fit bg-white text-black hover:bg-gray-100 font-bold">
                  <Link href="/?category=Pakaian">Lihat Koleksi</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[240px] rounded-3xl overflow-hidden group">
              <Image 
                src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80" 
                alt="Kuliner Nusantara" 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-3 bg-white text-black font-bold">Kuliner Pilihan</Badge>
                <h3 className="text-3xl font-bold text-white mb-2">Cita Rasa Nusantara<br/>Di Meja Anda</h3>
                <Button asChild size="sm" className="w-fit bg-white text-black hover:bg-gray-100 font-bold">
                  <Link href="/?category=Makanan">Pesan Sekarang</Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Benefits Section */}
        <section className="bg-white p-10 rounded-[40px] border shadow-sm">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Mengapa Belanja di UMKM Kita?</h2>
              <p className="text-muted-foreground mt-2">Memberikan pengalaman belanja terbaik untuk Anda dan Penjual.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="text-xl font-bold">Transaksi 100% Aman</h4>
                <p className="text-gray-500 text-sm leading-relaxed">Sistem pembayaran yang terenkripsi dan aman untuk menjamin kenyamanan Anda dalam bertransaksi.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold">Pengiriman Kurir Lokal</h4>
                <p className="text-gray-500 text-sm leading-relaxed">Dukungan kurir lokal yang mengenal area Anda dengan baik untuk pengiriman yang lebih personal dan cepat.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold">Produk UMKM Terkurasi</h4>
                <p className="text-gray-500 text-sm leading-relaxed">Semua penjual telah melalui proses verifikasi untuk memastikan kualitas produk yang Anda terima.</p>
              </div>
           </div>
        </section>

      </main>

      {/* Footer Section */}
      <footer className="bg-white border-t pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                 <div className="bg-orange-600 p-1.5 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-white" />
                 </div>
                 <span className="text-2xl font-black text-orange-600 tracking-tighter">UMKM<span className="text-gray-900">KITA</span></span>
              </div>
              <p className="text-gray-500 leading-relaxed">
                Pasar digital lokal terbesar di Indonesia. Kami berfokus pada pemberdayaan UMKM lokal melalui teknologi yang mudah digunakan.
              </p>
              <div className="flex gap-4">
                 <Link href="#" className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors">
                    <Star className="h-5 w-5" />
                 </Link>
                 <Link href="#" className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors">
                    <Heart className="h-5 w-5" />
                 </Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Pusat Belanja</h4>
              <ul className="space-y-4 text-gray-500">
                <li className="hover:text-orange-600 cursor-pointer transition-colors">Kategori Populer</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">Promo Hari Ini</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">Metode Pembayaran</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">Lacak Pengiriman</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Bantuan & Panduan</h4>
              <ul className="space-y-4 text-gray-500">
                <li className="hover:text-orange-600 cursor-pointer transition-colors">Hubungi Kami</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">Cara Belanja</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">Kebijakan Pengembalian</li>
                <li className="hover:text-orange-600 cursor-pointer transition-colors">Pusat Bantuan</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Informasi Kontak</h4>
              <ul className="space-y-4 text-gray-500">
                <li className="flex items-center gap-3">
                   <MapPin className="h-5 w-5 text-orange-600" />
                   <span>Jakarta, Indonesia</span>
                </li>
                <li className="flex items-center gap-3">
                   <Clock className="h-5 w-5 text-orange-600" />
                   <span>Senin - Jumat: 09:00 - 18:00</span>
                </li>
                <li className="mt-6">
                   <p className="text-sm font-bold text-gray-900 mb-2">Berlangganan Newsletter</p>
                   <div className="flex gap-2">
                      <Input className="bg-gray-50" placeholder="Email Anda" />
                      <Button className="bg-orange-600 hover:bg-orange-700">Daftar</Button>
                   </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2024 UMKM Kita. Berdaya Bersama Lokal.</p>
            <div className="flex gap-6">
               <span className="hover:text-orange-600 cursor-pointer">Syarat & Ketentuan</span>
               <span className="hover:text-orange-600 cursor-pointer">Kebijakan Privasi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
