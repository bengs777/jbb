"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AddToCartButton({ product }: { product: any }) {
  const { addItem } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  const handleAdd = async () => {
    if (!session) {
      router.push("/auth");
      return;
    }
    await addItem(product);
    toast.success("Berhasil ditambahkan ke keranjang");
  };

  return (
    <Button 
      variant="outline" 
      className="flex-1 h-14 border-orange-600 text-orange-600 hover:bg-orange-50 text-lg"
      onClick={handleAdd}
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      Masukkan Keranjang
    </Button>
  );
}
