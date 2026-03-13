"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Store, 
  Truck, 
  LayoutDashboard, 
  User, 
  Package, 
  History, 
  Settings, 
  LogOut, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role && session.user.role !== "buyer") {
      if (session.user.role === "seller") router.push("/dashboard/seller");
      if (session.user.role === "courier") router.push("/dashboard/courier");
      if (session.user.role === "admin") router.push("/dashboard/admin");
    }
  }, [session, router]);

  const fetchOrders = async () => {
    if (!session) return;
    try {
      const role = session.user.role || 'buyer';
      const res = await fetch(`/api/orders?role=${role}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      toast.error("Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [session]);

  if (!session) {
    return <div className="p-20 text-center">Loading...</div>;
  }

  const role = session.user.role || "buyer";

  const filterOrders = (statusGroup: string) => {
    if (statusGroup === 'all') return orders;
    if (statusGroup === 'pending') return orders.filter((o: any) => o.status === 'pending');
    if (statusGroup === 'active') return orders.filter((o: any) => ['paid', 'processed', 'shipping'].includes(o.status));
    if (statusGroup === 'done') return orders.filter((o: any) => o.status === 'completed');
    return orders;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Halo, {session.user.name}</h1>
            <p className="text-muted-foreground capitalize">Dashboard {role}</p>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-white px-3 py-1 border-orange-200">
              Role: <span className="ml-1 font-bold text-orange-600 capitalize">{role}</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Sidebar */}
          <aside className="md:col-span-1 space-y-2">
            <Card>
              <CardContent className="p-2 space-y-1">
                <Button variant="ghost" className="w-full justify-start bg-orange-50 text-orange-600">
                   <History className="mr-2 h-4 w-4" /> Pesanan Saya
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" /> Profil
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" /> Pengaturan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="md:col-span-3 space-y-6">
            <Tabs defaultValue="all" className="w-full">
              <div className="bg-gray-100/80 p-1 rounded-full inline-flex w-full md:w-auto mb-6">
                <TabsList className="bg-transparent h-auto p-0 flex w-full md:w-auto overflow-x-auto no-scrollbar gap-1">
                  <TabsTrigger 
                    value="all" 
                    className="rounded-full px-6 py-2 text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-gray-200"
                  >
                    Semua
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pending" 
                    className="rounded-full px-6 py-2 text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-gray-200"
                  >
                    Tertunda
                  </TabsTrigger>
                  <TabsTrigger 
                    value="active" 
                    className="rounded-full px-6 py-2 text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-gray-200"
                  >
                    Proses
                  </TabsTrigger>
                  <TabsTrigger 
                    value="done" 
                    className="rounded-full px-6 py-2 text-sm transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-gray-200"
                  >
                    Selesai
                  </TabsTrigger>
                </TabsList>
              </div>

              {['all', 'pending', 'active', 'done'].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-0 space-y-4 outline-none">
                  {loading ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                      Memuat pesanan...
                    </div>
                  ) : filterOrders(tab).length > 0 ? (
                    filterOrders(tab).map((order: any) => (
                      <OrderCard key={order.id} order={order} role={role} onUpdate={fetchOrders} />
                    ))
                  ) : (
                    <Card className="p-12 text-center text-muted-foreground">
                      <Package className="mx-auto mb-4 h-12 w-12 opacity-20" />
                      <p>Belum ada pesanan {tab !== 'all' ? 'dengan status ini' : ''}</p>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order, role, onUpdate }: { order: any, role: string, onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    await fetch('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ orderId: order.id, status: newStatus }),
    });
    onUpdate();
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge variant="secondary" className="font-normal"><Clock className="mr-1 h-3 w-3" /> Menunggu Pembayaran</Badge>;
      case 'paid': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-normal"><CheckCircle className="mr-1 h-3 w-3" /> Sudah Dibayar</Badge>;
      case 'processed': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 font-normal"><Package className="mr-1 h-3 w-3" /> Diproses Penjual</Badge>;
      case 'shipping': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 font-normal"><Truck className="mr-1 h-3 w-3" /> Dikirim</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-normal"><CheckCircle className="mr-1 h-3 w-3" /> Selesai</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50/50 border-b py-3 px-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">#{order.externalId}</span>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden relative border">
                <img src={item.product?.imageUrl} className="object-cover h-full w-full" alt={item.product?.name} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.product?.name}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} x Rp {item.priceAtPurchase.toLocaleString()}</p>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between items-end border-t pt-4">
             <div className="text-xs text-muted-foreground">
                <p>Penjual: <span className="text-orange-600 font-medium">{order.seller?.name}</span></p>
                <p>Dipesan pada: {new Date(order.createdAt).toLocaleString("id-ID")}</p>
             </div>
             <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Pesanan</p>
                <p className="text-lg font-bold text-orange-600">Rp {order.totalAmount.toLocaleString()}</p>
             </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            {/* Buyer Actions */}
            {role === 'buyer' && order.status === 'pending' && (
              <Button size="sm" variant="outline" onClick={() => router.push('/checkout')} className="border-orange-200 text-orange-600 hover:bg-orange-50">
                Lihat Pembayaran
              </Button>
            )}
            {role === 'buyer' && order.status === 'shipping' && (
              <Button size="sm" onClick={() => updateStatus('completed')} disabled={loading} className="bg-green-600 hover:bg-green-700">
                Pesanan Diterima
              </Button>
            )}
            <Button size="sm" variant="ghost" asChild>
               <Link href={`/shop/${order.sellerId}`}>Kunjungi Toko</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
