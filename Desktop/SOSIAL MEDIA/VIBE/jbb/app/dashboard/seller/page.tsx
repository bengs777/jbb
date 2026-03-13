"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, Package, TrendingUp, Plus, ChevronRight, Camera, ExternalLink, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ImageUpload } from "@/components/ui/image-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SellerDashboard() {
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [shopImage, setShopImage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!session || session.user.role !== "seller")) {
      router.push("/dashboard");
    }
    if (session?.user?.image) {
      setShopImage(session.user.image);
    }
  }, [session, isPending, router]);

  const fetchStats = async () => {
    try {
      const resProducts = await fetch("/api/products");
      const dataProducts = await resProducts.json();
      
      const resOrders = await fetch("/api/orders?role=seller");
      const dataOrders = await resOrders.json();

      const sellerProducts = dataProducts.filter((p: any) => p.sellerId === session?.user.id);
      const revenue = dataOrders
        .filter((o: any) => o.status === "completed" || o.status === "paid")
        .reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);

      setStats({
        products: sellerProducts.length,
        orders: dataOrders.length,
        revenue: revenue
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchStats();
  }, [session]);

  const handleUpdateImage = async (url: string) => {
    setShopImage(url);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      if (res.ok) {
        toast.success("Foto profil toko berhasil diperbarui");
        router.refresh();
      } else {
        toast.error("Gagal memperbarui foto profil");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  if (isPending || !session) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="mb-8">
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600" />
            <CardContent className="relative pt-0">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-12 mb-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                    <AvatarImage src={shopImage || session.user.image || ""} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-2xl">
                      {session.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center md:text-left pt-2 md:pt-14 pb-2 flex-1">
                  <h1 className="text-2xl font-bold">{session.user.name}</h1>
                  <p className="text-sm text-muted-foreground">ID Penjual: {session.user.id}</p>
                </div>
                <div className="md:pt-14 pb-2 flex gap-2">
                   <Button variant="outline" size="sm" asChild>
                      <Link href={`/shop/${session.user.id}`} target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" /> Lihat Toko
                      </Link>
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                  <Package className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.products}</div>
                  <p className="text-xs text-muted-foreground mt-1">Produk aktif</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.orders}</div>
                  <p className="text-xs text-muted-foreground mt-1">Pesanan masuk</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Rp {stats.revenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Produk Saya</h2>
                <Button size="sm" asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link href="/dashboard/seller/products">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                  </Link>
                </Button>
              </div>
              <Card className="border-none shadow-sm">
                <CardContent className="p-0">
                   <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <Package className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold">Kelola Inventaris</h3>
                      <p className="text-sm text-muted-foreground mb-4">Lihat dan edit semua produk UMKM Anda</p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/seller/products">Buka Manajemen Produk</Link>
                      </Button>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Pengaturan Toko</CardTitle>
                <CardDescription>Perbarui identitas visual UMKM Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Foto Profil Toko</label>
                  <ImageUpload 
                    value={shopImage} 
                    onChange={handleUpdateImage}
                    route="avatar"
                  />
                  <p className="text-xs text-muted-foreground">
                    Gunakan logo atau foto UMKM terbaik Anda. Ukuran ideal 1:1.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Tautan Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <Button variant="outline" className="w-full justify-between group" asChild>
                    <Link href={`/shop/${session.user.id}`}>
                       <span>Kunjungi Toko Saya</span>
                       <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                 </Button>
                 <Button variant="outline" className="w-full justify-between group" asChild>
                    <Link href="/dashboard/seller/orders">
                       <span>Lihat Pesanan Masuk</span>
                       <ShoppingBag className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                 </Button>
                 <Button variant="outline" className="w-full justify-between group bg-green-50/50 border-green-200 text-green-700 hover:bg-green-100" asChild>
                    <Link href="/dashboard/seller/payouts">
                       <span className="font-semibold">Keuangan & Penarikan</span>
                       <Wallet className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </Link>
                 </Button>
                 <Button variant="outline" className="w-full justify-between group" asChild>
                    <Link href="/profile">
                       <span>Profil Akun</span>
                       <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                 </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
