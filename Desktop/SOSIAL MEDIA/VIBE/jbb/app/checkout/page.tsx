"use client";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, QrCode, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

const PAYMENT_METHODS = [
  { id: "qris", name: "QRIS / E-Wallet", icon: QrCode },
  { id: "bca_va", name: "BCA Virtual Account", icon: Building },
  { id: "bri_va", name: "BRI Virtual Account", icon: Building },
  { id: "bni_va", name: "BNI Virtual Account", icon: Building },
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const { data: session } = useSession();
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const router = useRouter();

  const handleCheckout = async () => {
    if (!session) return;
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod: selectedMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderResult(data);
        clearCart();
        toast.success("Pesanan berhasil dibuat!");
      } else {
        toast.error("Gagal membuat pesanan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (orderResult) {
    const isQRIS = orderResult.paymentMethod === "qris";
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Instruksi Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Tagihan</p>
                <p className="text-3xl font-bold text-orange-600">
                  Rp {orderResult.totalPayment.toLocaleString("id-ID")}
                </p>
              </div>

              {isQRIS ? (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm font-medium">Scan QRIS ini untuk membayar</p>
                  <div className="bg-white p-6 rounded-xl border-2 border-dashed border-orange-200">
                    <QRCode value={orderResult.paymentNumber || ""} size={200} />
                  </div>
                  <p className="text-xs text-muted-foreground">Berlaku sampai {new Date(orderResult.paymentExpiredAt).toLocaleString()}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium">Silakan transfer ke Virtual Account berikut:</p>
                  <div className="p-6 bg-white border rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase mb-2">{orderResult.paymentMethod.replace('_va', '').toUpperCase()} Virtual Account</p>
                    <p className="text-3xl font-mono font-bold tracking-wider">{orderResult.paymentNumber}</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => {
                    navigator.clipboard.writeText(orderResult.paymentNumber);
                    toast.success("Nomor VA disalin");
                  }}>Salin Nomor VA</Button>
                </div>
              )}

              <div className="pt-6 border-t">
                <Button onClick={() => router.push("/dashboard")} className="w-full bg-orange-600">Cek Status Pesanan</Button>
                <p className="mt-4 text-xs text-muted-foreground">
                  Status pesanan akan berubah otomatis setelah pembayaran berhasil.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metode Pembayaran (Pakasir)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedMethod === method.id ? "border-orange-600 bg-orange-50" : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <method.icon className={`h-6 w-6 ${selectedMethod === method.id ? "text-orange-600" : "text-gray-400"}`} />
                      <span className="font-medium">{method.name}</span>
                    </div>
                    {selectedMethod === method.id && <Check className="h-5 w-5 text-orange-600" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.product.name}</span>
                        <span className="text-xs text-muted-foreground">Jumlah: {item.quantity}</span>
                      </div>
                      <span>Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Tagihan</span>
                  <span className="text-orange-600">Rp {total.toLocaleString("id-ID")}</span>
                </div>
                <Button 
                  onClick={handleCheckout} 
                  disabled={loading || items.length === 0} 
                  className="w-full bg-orange-600 h-12 text-lg hover:bg-orange-700"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Bayar Sekarang"}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                  Dengan mengklik tombol, Anda menyetujui Syarat & Ketentuan UMKM Kita.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
