"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Store, 
  Calendar, 
  MapPin, 
  Star, 
  MessageSquare, 
  Share2, 
  Info,
  Clock,
  Package,
  ArrowLeft,
  Search,
  ChevronRight
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SellerShopPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.sellerId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sellers/${sellerId}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, [sellerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Navbar />
        <div className="h-48 bg-gray-200 animate-pulse" />
        <main className="container mx-auto px-4 -mt-20 relative z-10 pb-20">
          <div className="bg-white rounded-3xl p-8 shadow-sm border space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-2xl" />
              <div className="flex-1 space-y-4 text-center md:text-left">
                <Skeleton className="h-10 w-64 mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data?.seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-sm border space-y-6 max-w-md">
                <div className="h-20 w-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                    <Store className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-bold">Toko Tidak Ditemukan</h1>
                <p className="text-muted-foreground">Maaf, toko yang Anda cari mungkin sudah tidak aktif atau tautan yang Anda masukkan salah.</p>
                <Button onClick={() => router.push("/")} className="bg-orange-600 hover:bg-orange-700 w-full">Kembali ke Beranda</Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      
      {/* Banner Section */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-orange-400 to-orange-600 relative overflow-hidden">
         <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute bottom-10 right-20 h-48 w-48 rounded-full bg-white/40 blur-3xl" />
         </div>
         <div className="container mx-auto px-4 h-full flex items-center">
            <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 mb-auto mt-6"
                onClick={() => router.back()}
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Button>
         </div>
      </div>

      <main className="container mx-auto px-4 -mt-24 md:-mt-32 relative z-10 pb-20">
        {/* Shop Info Card */}
        <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border mb-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="relative -mt-16 md:-mt-20 mx-auto md:mx-0">
               <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-[2rem] border-[6px] border-white shadow-xl">
                  <AvatarImage src={data.seller.image || ""} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-orange-600 text-white font-bold rounded-[2rem]">
                    {data.seller.name.charAt(0)}
                  </AvatarFallback>
               </Avatar>
               <Badge className="absolute -bottom-2 right-0 bg-green-500 hover:bg-green-600 border-2 border-white px-3 py-1 shadow-md">
                 Online
               </Badge>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    {data.seller.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <span>Jakarta, Indonesia</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-gray-700">4.9</span>
                      <span className="text-gray-400">(200+ Penilaian)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                   <Button variant="outline" className="rounded-xl border-orange-600 text-orange-600 hover:bg-orange-50 font-bold">
                      <MessageSquare className="mr-2 h-4 w-4" /> Chat
                   </Button>
                   <Button className="rounded-xl bg-orange-600 hover:bg-orange-700 font-bold">
                      Ikuti Toko
                   </Button>
                   <Button variant="ghost" size="icon" className="rounded-xl">
                      <Share2 className="h-5 w-5" />
                   </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Produk</p>
                   <p className="text-xl font-bold">{data.products.length}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Pengikut</p>
                   <p className="text-xl font-bold">1.2k</p>
                </div>
                <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Rating</p>
                   <div className="flex items-center gap-1">
                      <p className="text-xl font-bold">4.9</p>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                   </div>
                </div>
                <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Buka Sejak</p>
                   <p className="text-sm font-bold pt-1">{new Date(data.seller.createdAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 space-y-6">
                <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Cari di Toko</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input className="pl-10 rounded-xl bg-gray-50 border-none" placeholder="Nama produk..." />
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-bold text-lg">Kategori</h3>
                            <div className="space-y-2">
                                {["Semua Produk", "Makanan Ringan", "Oleh-oleh", "Minuman", "Terbaru"].map((cat, i) => (
                                    <div key={cat} className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${i === 0 ? 'bg-orange-50 text-orange-600 font-bold' : 'hover:bg-gray-50'}`}>
                                        <span className="text-sm">{cat}</span>
                                        <ChevronRight className="h-4 w-4 opacity-50" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 border-t space-y-4">
                             <div className="flex items-center gap-3 text-sm text-gray-500">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span>Balas Chat: ~15 mnt</span>
                             </div>
                             <div className="flex items-center gap-3 text-sm text-gray-500">
                                <Package className="h-4 w-4 text-orange-600" />
                                <span>Pesanan Terkirim: 99%</span>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </aside>

            {/* Product Listing */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border">
                    <Tabs defaultValue="populer" className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList className="bg-transparent border-none">
                                <TabsTrigger value="populer" className="rounded-xl data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">Populer</TabsTrigger>
                                <TabsTrigger value="terbaru" className="rounded-xl data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">Terbaru</TabsTrigger>
                                <TabsTrigger value="harga" className="rounded-xl data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold">Harga</TabsTrigger>
                            </TabsList>
                            <div className="hidden md:block text-sm text-gray-500">
                                Menampilkan <span className="font-bold text-gray-900">{data.products.length}</span> produk
                            </div>
                        </div>
                    </Tabs>
                </div>

                {data.products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {data.products.map((product: any) => (
                      <ProductCard key={product.id} product={{...product, seller: data.seller}} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] p-20 text-center border shadow-sm flex flex-col items-center">
                    <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <Package className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold">Belum Ada Produk</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Toko ini sedang menyiapkan koleksi produk terbaik mereka. Silakan kembali lagi nanti!</p>
                  </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
