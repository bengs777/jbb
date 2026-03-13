"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Package, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  Search,
  MoreVertical,
  Eye,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function SellerOrders() {
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!session || session.user.role !== "seller")) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?role=seller");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pesanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchOrders();
  }, [session]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Status pesanan berhasil diubah menjadi ${newStatus}`);
        fetchOrders(); // Refresh data
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal memperbarui status");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Menunggu Pembayaran</Badge>;
      case "paid":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Perlu Diproses</Badge>;
      case "processed":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Sedang Dikemas</Badge>;
      case "shipping":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Dalam Pengiriman</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Selesai</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.externalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isPending || !session) return <div className="p-20 text-center text-muted-foreground animate-pulse">Memuat dashboard penjual...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 px-2 text-muted-foreground">
                <Link href="/dashboard/seller">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Pesanan</h1>
            <p className="text-muted-foreground">Pantau dan proses semua pesanan dari pelanggan UMKM Anda.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari ID pesanan atau nama pembeli..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[180px]">ID Pesanan</TableHead>
                <TableHead>Pembeli</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-24 bg-gray-100 animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-gray-100 animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-40 bg-gray-100 animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-gray-100 animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-6 w-24 bg-gray-100 animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-8 w-8 ml-auto bg-gray-100 animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold">{order.externalId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.buyer?.name}</span>
                        <span className="text-xs text-muted-foreground">{order.buyer?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          {order.items[0]?.product?.name}
                          {order.items.length > 1 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (+{order.items.length - 1} lainnya)
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">Rp {order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detail Pesanan {selectedOrder?.externalId}</DialogTitle>
                              <DialogDescription>
                                Dipesan pada {selectedOrder && new Date(selectedOrder.createdAt).toLocaleDateString('id-ID', { 
                                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-semibold mb-1">Info Pembeli</h4>
                                    <p className="text-sm">{selectedOrder.buyer?.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.buyer?.email}</p>
                                  </div>
                                  <div className="text-right">
                                    <h4 className="text-sm font-semibold mb-1">Status Pembayaran</h4>
                                    <p className="text-sm capitalize">{selectedOrder.paymentMethod || 'QRIS'}</p>
                                    <p className="text-xs font-medium text-green-600">
                                      {selectedOrder.status !== 'pending' ? 'Lunas' : 'Belum Bayar'}
                                    </p>
                                  </div>
                                </div>
                                <Separator />
                                <div>
                                  <h4 className="text-sm font-semibold mb-3">Item Pesanan</h4>
                                  <div className="space-y-3">
                                    {selectedOrder.items.map((item: any) => (
                                      <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {item.product?.imageUrl ? (
                                              <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                              <Package className="h-5 w-5 text-gray-400" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="font-medium">{item.product?.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.quantity} x Rp {item.priceAtPurchase.toLocaleString()}</p>
                                          </div>
                                        </div>
                                        <p className="font-semibold">Rp {(item.quantity * item.priceAtPurchase).toLocaleString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center font-bold">
                                  <span>Total Pembayaran</span>
                                  <span className="text-lg text-orange-600">Rp {selectedOrder.totalAmount.toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Aksi Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {/* Sellers can mark as PROCESSED when it's PAID */}
                            {order.status === "paid" && (
                              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "processed")}>
                                <Package className="mr-2 h-4 w-4 text-orange-600" />
                                <span>Mulai Kemas (Proses)</span>
                              </DropdownMenuItem>
                            )}

                            {/* Completed can only be done after shipping or manually if needed */}
                            {order.status === "shipping" && (
                              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "completed")}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                <span>Selesaikan Pesanan</span>
                              </DropdownMenuItem>
                            )}

                            {/* Any pending/paid order can be cancelled */}
                            {(order.status === "pending" || order.status === "paid" || order.status === "processed") && (
                              <DropdownMenuItem 
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                                className="text-red-600 focus:text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                <span>Batalkan Pesanan</span>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                               <Link href={`/shop/${session.user.id}`} target="_blank">
                                 <ExternalLink className="mr-2 h-4 w-4" />
                                 <span>Buka Toko</span>
                               </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-72 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-gray-200 mb-4" />
                      <h3 className="text-lg font-semibold">Belum Ada Pesanan</h3>
                      <p className="text-sm text-muted-foreground">Pesanan dari pelanggan Anda akan muncul di sini.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}

function ExternalLink({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    </svg>
  );
}
