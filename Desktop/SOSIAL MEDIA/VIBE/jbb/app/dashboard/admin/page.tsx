"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Store, 
  Truck, 
  TrendingUp, 
  ArrowRight,
  User,
  Package,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Seller {
  id: string;
  name: string;
  email: string;
  totalSales: number;
  totalRevenue: number;
  productCount: number;
}

interface Courier {
  id: string;
  name: string;
  email: string;
  totalDeliveries: number;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<{
    sellers: Seller[];
    couriers: Courier[];
    stats: Stats;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/overview");
        const json = await res.json();
        setData(json);
      } catch (error) {
        toast.error("Gagal mengambil data overview");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6 px-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Overview Sistem</h1>
        <p className="text-sm text-muted-foreground">Monitoring performa UMKM dan Kurir secara realtime.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIDR(data?.stats.totalRevenue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.sellers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Couriers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.couriers.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sellers Transparency Table */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performa Penjual</CardTitle>
              <CardDescription>Transparansi data penjualan setiap UMKM.</CardDescription>
            </div>
            <Link href="/dashboard/admin/payouts">
               <Button variant="outline" size="sm" className="gap-2">
                 Kelola Payout <ArrowRight className="w-4 h-4" />
               </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Seller</TableHead>
                  <TableHead className="text-right">Produk</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div className="font-medium">{seller.name}</div>
                      <div className="text-xs text-muted-foreground">{seller.email}</div>
                    </TableCell>
                    <TableCell className="text-right">{seller.productCount}</TableCell>
                    <TableCell className="text-right">{seller.totalSales}</TableCell>
                    <TableCell className="text-right font-semibold">{formatIDR(seller.totalRevenue || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Couriers Transparency Table */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Performa Kurir</CardTitle>
            <CardDescription>Data pengiriman dari kurir terdaftar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kurir</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Pengiriman Selesai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.couriers.map((courier) => (
                  <TableRow key={courier.id}>
                    <TableCell>
                      <div className="font-medium">{courier.name}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{courier.email}</TableCell>
                    <TableCell className="text-right font-semibold">{courier.totalDeliveries}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
