"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Banknote, 
  ExternalLink,
  Search,
  Check,
  X,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  seller: {
    name: string;
    email: string;
  };
}

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/payouts");
      const json = await res.json();
      setRequests(json);
    } catch (error) {
      toast.error("Gagal mengambil data permintaan payout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (status: "completed" | "rejected") => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          status,
          adminNote,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(`Berhasil menandai sebagai \${status === "completed" ? "Selesai" : "Ditolak"}`);
      setSelectedRequest(null);
      setAdminNote("");
      fetchRequests();
    } catch (error) {
      toast.error("Gagal memperbarui status");
    } finally {
      setActionLoading(false);
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
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">Menunggu</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Selesai</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(r => 
    r.seller.name.toLowerCase().includes(search.toLowerCase()) ||
    r.bankName.toLowerCase().includes(search.toLowerCase()) ||
    r.accountNumber.includes(search)
  );

  if (loading) {
    return (
      <div className="space-y-6 px-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Payout</h1>
          <p className="text-sm text-muted-foreground">Validasi dan proses penarikan dana penjual.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Cari seller, bank, atau no rekening..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Rincian Bank</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Tidak ada permintaan penarikan dana.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.seller.name}</div>
                      <div className="text-xs text-muted-foreground">{request.seller.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{request.bankName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{request.accountNumber}</div>
                      <div className="text-xs text-muted-foreground uppercase">{request.accountName}</div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatIDR(request.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(request.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-8 gap-2"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <CreditCard className="w-4 h-4" /> Proses
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Proses Penarikan Dana</DialogTitle>
            <DialogDescription>
              Silakan lakukan transfer manual ke rekening di bawah ini sebelum menandai sebagai selesai.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Bank</Label>
                  <p className="font-bold">{selectedRequest.bankName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Jumlah Transfer</Label>
                  <p className="font-bold text-green-600">{formatIDR(selectedRequest.amount)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Nomor Rekening</Label>
                  <p className="font-mono font-bold text-lg select-all">{selectedRequest.accountNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Atas Nama</Label>
                  <p className="font-bold uppercase">{selectedRequest.accountName}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Catatan (Opsional)</Label>
                <Textarea 
                  id="note" 
                  placeholder="Contoh: Transfer berhasil dilakukan via m-Banking BCA. Ref: 12345"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="destructive" 
              className="flex-1 gap-2" 
              disabled={actionLoading}
              onClick={() => handleUpdateStatus("rejected")}
            >
              <X className="w-4 h-4" /> Tolak
            </Button>
            <Button 
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700" 
              disabled={actionLoading}
              onClick={() => handleUpdateStatus("completed")}
            >
              <Check className="w-4 h-4" /> Sudah Ditransfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
