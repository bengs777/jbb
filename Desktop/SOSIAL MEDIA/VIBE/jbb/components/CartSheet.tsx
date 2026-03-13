"use client";

import { useCartStore } from "@/lib/store";
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function CartSheet() {
  const { items, setItems, isOpen, setIsOpen } = useCartStore();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const updateQuantity = async (productId: string, delta: number) => {
    setLoading(productId);
    try {
      const item = items.find((i) => i.productId === productId);
      if (!item) return;

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        await removeItem(productId);
        return;
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: delta }),
      });

      if (res.ok) {
        const updatedCart = await res.json();
        setItems(updatedCart);
      }
    } catch (error) {
      toast.error("Gagal memperbarui keranjang");
    } finally {
      setLoading(null);
    }
  };

  const removeItem = async (productId: string) => {
    setLoading(productId);
    try {
      const res = await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const updatedCart = await res.json();
        setItems(updatedCart);
        toast.success("Produk dihapus dari keranjang");
      }
    } catch (error) {
      toast.error("Gagal menghapus produk");
    } finally {
      setLoading(null);
    }
  };

  const total = items.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 p-0 text-[10px] text-white">
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Keranjang Belanja
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-orange-100 p-6">
              <ShoppingCart className="h-12 w-12 text-orange-600" />
            </div>
            <p className="text-lg font-medium">Keranjang masih kosong</p>
            <Button variant="outline" onClick={() => { setIsOpen(false); router.push("/"); }}>
              Mulai Belanja
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex space-x-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200"}
                        alt={item.product?.name || "Produk"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{item.product?.name}</span>
                        <span className="text-sm text-muted-foreground">
                          Rp {item.product?.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 rounded-md border p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={loading === item.productId}
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {loading === item.productId ? (
                              <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={loading === item.productId}
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                          disabled={loading === item.productId}
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
              <SheetFooter className="mt-4">
                <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => { setIsOpen(false); router.push("/checkout"); }}
                >
                    Lanjut ke Pembayaran
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
