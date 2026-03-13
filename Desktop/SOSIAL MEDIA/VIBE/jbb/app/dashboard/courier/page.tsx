"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Package, CheckCircle, Clock, MapPin, Search, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function CourierDashboard() {
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState({ available: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!session || session.user.role !== "courier")) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  const fetchStats = async () => {
    try {
      // Fetch available orders
      const resAvail = await fetch("/api/courier/available");
      const dataAvail = await resAvail.json();
      
      // Fetch my deliveries
      const resMy = await fetch("/api/courier/deliveries");
      const dataMy = await resMy.json();

      setStats({
        available: dataAvail.length || 0,
        active: dataMy.length || 0,
        completed: 0 // In a real app we'd fetch historical completed count
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

  if (isPending || !session) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard Kurir</h1>
          <p className="text-muted-foreground">Kelola pengiriman UMKM lokal Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Tersedia untuk Diambil</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.available}</div>
              <p className="text-xs text-muted-foreground">Pesanan siap kirim</p>
              <Button variant="link" className="px-0 h-auto text-orange-600 mt-2" asChild>
                <Link href="/dashboard/courier/available">Lihat Semua <ChevronRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pengiriman Aktif</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Sedang dalam proses</p>
              <Button variant="link" className="px-0 h-auto text-blue-600 mt-2" asChild>
                <Link href="/dashboard/courier/deliveries">Kelola Pengiriman <ChevronRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Selesai Hari Ini</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Berhasil diantar</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
           <h2 className="text-xl font-bold">Aksi Cepat</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button size="lg" className="h-24 text-lg bg-orange-600 hover:bg-orange-700" asChild>
                <Link href="/dashboard/courier/available">
                  <Search className="mr-3 h-6 w-6" /> Cari Pesanan Baru
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-24 text-lg border-2" asChild>
                <Link href="/dashboard/courier/deliveries">
                  <MapPin className="mr-3 h-6 w-6" /> Lihat Rute Pengiriman
                </Link>
              </Button>
           </div>
        </div>
      </main>
    </div>
  );
}
