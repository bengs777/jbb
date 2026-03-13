"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, CheckCircle, MapPin, ArrowLeft, Loader2, Phone, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function MyDeliveries() {
  const { data: session } = useSession();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const router = useRouter();

  const fetchDeliveries = async () => {
    try {
      const res = await fetch("/api/courier/deliveries");
      const data = await res.json();
      setDeliveries(data);
    } catch (err) {
      toast.error("Gagal memuat pengiriman aktif");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchDeliveries();
  }, [session]);

  const completeDelivery = async (orderId: string) => {
    setCompleting(orderId);
    try {
      const res = await fetch("/api/courier/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        toast.success("Pengiriman selesai! Selamat!");
        fetchDeliveries();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menyelesaikan pengiriman");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    } finally {
      setCompleting(null);
    }
  };

  if (loading) return <div className="p-20 text-center">Memuat pengiriman...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/courier"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pengiriman Aktif</h1>
            <p className="text-muted-foreground">Antar pesanan ke pembeli tepat waktu</p>
          </div>
        </div>

        {deliveries.length === 0 ? (
          <Card className="p-12 text-center">
             <Truck className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
             <h3 className="text-lg font-medium">Tidak ada pengiriman aktif</h3>
             <p className="text-muted-foreground">Silakan ambil pesanan baru di halaman pencarian.</p>
             <Button className="mt-4 bg-orange-600 hover:bg-orange-700" asChild>
                <Link href="/dashboard/courier/available">Cari Pesanan</Link>
             </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {deliveries.map((delivery: any) => (
              <Card key={delivery.id} className="overflow-hidden border-blue-100 border-2">
                <CardHeader className="bg-blue-50/50 flex flex-row items-center justify-between">
                  <div>
                    <Badge className="bg-blue-600 mb-1">Sedang Dikirim</Badge>
                    <CardTitle className="text-lg">#{delivery.externalId}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Tiba di Estimasi</p>
                    <p className="font-semibold text-blue-600">Hari Ini</p>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div className="relative pl-6 border-l-2 border-dashed border-gray-200 space-y-8">
                          <div className="relative">
                             <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-orange-500 border-2 border-white shadow-sm" />
                             <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Dari (Seller)</p>
                                <p className="font-semibold">{delivery.seller?.name}</p>
                                <p className="text-sm text-muted-foreground">{delivery.seller?.email}</p>
                             </div>
                          </div>
                          <div className="relative">
                             <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                             <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Ke (Buyer)</p>
                                <p className="font-semibold">{delivery.buyer?.name}</p>
                                <p className="text-sm text-muted-foreground">Alamat Pembeli (Cek Profil)</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                       <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <p className="text-sm font-semibold">Ringkasan Barang:</p>
                          {delivery.items?.map((item: any) => (
                             <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.product?.name}</span>
                             </div>
                          ))}
                          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                             <span>Total Tagihan</span>
                             <span className="text-orange-600">Rp {delivery.totalAmount.toLocaleString()}</span>
                          </div>
                       </div>

                       <div className="flex gap-3">
                          <Button variant="outline" className="flex-1" asChild>
                             <a href={`mailto:${delivery.buyer?.email}`}>
                                <Phone className="h-4 w-4 mr-2" /> Hubungi
                             </a>
                          </Button>
                          <Button 
                            className="flex-[2] bg-blue-600 hover:bg-blue-700"
                            onClick={() => completeDelivery(delivery.id)}
                            disabled={completing !== null}
                          >
                            {completing === delivery.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Selesaikan Pengiriman
                          </Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
