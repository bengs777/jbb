"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useCartStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { ShoppingCart, Store } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductCardProps {
  product: any;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      router.push("/auth");
      return;
    }
    await addItem(product);
    toast.success("Produk berhasil ditambahkan ke keranjang");
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"}
          alt={product.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <CardHeader className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight h-10">{product.name}</h3>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-orange-600">
            Rp {product.price.toLocaleString("id-ID")}
          </p>
        </div>
        <div 
          className="mt-2 flex items-center text-xs text-muted-foreground hover:text-orange-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (product.sellerId) {
                router.push(`/shop/${product.sellerId}`);
            }
          }}
        >
          <Store className="mr-1 h-3 w-3" />
          <span>{product.seller?.name || "UMKM Lokal"}</span>
        </div>
      </CardContent>
      <CardFooter className="p-3">
        <Button 
          variant="outline" 
          className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Tambah
        </Button>
      </CardFooter>
    </Card>
  );
}
