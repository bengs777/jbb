"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Package, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AvailableOrders() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState<string | null>(null);
  const router = useRouter();

  const fetchAvailable = async () => {
    try {
      const res = await fetch("/api/courier/available");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      toast.error("Gagal memuat pesanan tersedia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchAvailable();
  }, [session]);

  const takeOrder = async (orderId: string) => {
    setTaking(orderId);
    try {
      const res = await fetch("/api/courier/take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        toast.success("Pesanan berhasil diambil!");
        router.push("/dashboard/courier/deliveries");
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengambil pesanan");
        fetchAvailable();
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    } finally {
      setTaking(null);
    }
  };

  if (loading) return <div className="p-20 text-center">Memuat pesanan...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/courier"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cari Pesanan</h1>
            <p className="text-muted-foreground">Pilih pesanan yang ingin Anda kirim</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
             <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
             <h3 className="text-lg font-medium">Belum ada pesanan tersedia</h3>
             <p className="text-muted-foreground">Silakan cek kembali beberapa saat lagi.</p>
             <Button variant="outline" className="mt-4" onClick={fetchAvailable}>Refresh</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order: any) => (
              <Card key={order.id} className="overflow-hidden border-2 hover:border-orange-200 transition-colors">
                <CardHeader className="bg-orange-50/50 pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-white">#{order.externalId}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <CardTitle className="text-lg mt-2">Dipesan oleh {order.buyer?.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                     <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                        <div>
                           <p className="font-semibold">Lokasi Toko: {order.seller?.name}</p>
                           <p className="text-muted-foreground text-xs">{order.seller?.email}</p>
                        </div>
                     </div>
                  </div>

                  <div className="border-t pt-3">
                     <p className="text-xs text-muted-foreground mb-2">Item Pesanan:</p>
                     <div className="space-y-2">
                        {order.items?.map((item: any) => (
                           <div key={item.id} className="flex justify-between text-xs">
                              <span>{item.quantity}x {item.product?.name}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between">
                     <div>
                        <p className="text-xs text-muted-foreground">Ongkir/Layanan</p>
                        <p className="font-bold text-orange-600">Rp {(order.totalAmount * 0.1).toLocaleString()}</p>
                     </div>
                     <Button 
                       onClick={() => takeOrder(order.id)} 
                       disabled={taking !== null}
                       className="bg-orange-600 hover:bg-orange-700"
                     >
                       {taking === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                       Ambil Pesanan
                     </Button>
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
