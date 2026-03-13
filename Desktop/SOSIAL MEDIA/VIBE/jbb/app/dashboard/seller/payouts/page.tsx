"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  History, 
  Banknote, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  adminNote?: string;
  createdAt: string;
}

export default function SellerPayoutsPage() {
  const [data, setData] = useState<{
    balance: number;
    totalRevenue: number;
    totalPayouts: number;
    history: PayoutRequest[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/seller/payouts");
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Gagal mengambil data saldo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error("Jumlah tidak valid");
    if (Number(amount) > (data?.balance || 0)) return toast.error("Saldo tidak mencukupi");

    setRequestLoading(true);
    try {
      const res = await fetch("/api/seller/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          bankName,
          accountNumber,
          accountName,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Permintaan penarikan dana berhasil dikirim");
      setIsOpen(false);
      setAmount("");
      fetchData();
    } catch (error) {
      toast.error("Gagal mengirim permintaan penarikan");
    } finally {
      setRequestLoading(false);
    }
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Menunggu</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selesai</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 flex items-center gap-1"><XCircle className="w-3 h-3" /> Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dompet Penjual</h1>
          <p className="text-muted-foreground">Kelola pendapatan dan penarikan dana Anda.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Tarik Dana
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleRequestPayout}>
              <DialogHeader>
                <DialogTitle>Tarik Dana</DialogTitle>
                <DialogDescription>
                  Masukkan rincian rekening bank Anda untuk melakukan penarikan dana.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo Tersedia</Label>
                  <Input id="balance" value={formatIDR(data?.balance || 0)} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Penarikan (Rp)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="Contoh: 50000" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank">Nama Bank</Label>
                  <Input 
                    id="bank" 
                    placeholder="Contoh: BCA / Mandiri / BRI" 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Nomor Rekening</Label>
                  <Input 
                    id="account" 
                    placeholder="Contoh: 1234567890" 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Pemilik Rekening</Label>
                  <Input 
                    id="name" 
                    placeholder="Nama sesuai buku tabungan" 
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={requestLoading} className="w-full">
                  {requestLoading ? "Memproses..." : "Kirim Permintaan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/70">Saldo Tersedia</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="w-8 h-8" /> {formatIDR(data?.balance || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-foreground/60 italic">Dana yang dapat ditarik ke rekening Anda.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Penjualan</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Banknote className="w-8 h-8 text-green-500" /> {formatIDR(data?.totalRevenue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Akumulasi seluruh pesanan yang sudah dibayar.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Dana Ditarik</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <History className="w-8 h-8 text-blue-500" /> {formatIDR(data?.totalPayouts || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Dana yang telah atau sedang diproses penarikannya.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penarikan Dana</CardTitle>
          <CardDescription>Daftar permintaan penarikan dana yang Anda lakukan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Belum ada riwayat penarikan.
                  </TableCell>
                </TableRow>
              ) : (
                data?.history.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-xs">
                      {new Date(request.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{request.bankName}</div>
                      <div className="text-xs text-muted-foreground">{request.accountNumber} - {request.accountName}</div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatIDR(request.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {request.adminNote || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
