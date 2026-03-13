import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { Navbar } from "@/components/Navbar";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Store, Truck, Package } from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";
import { Button } from "@/components/ui/button";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      seller: true
    }
  });

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: Image */}
          <div className="relative aspect-square overflow-hidden rounded-xl border">
            <Image
              src={product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            <div className="flex items-center space-x-2 mb-6 text-sm text-muted-foreground">
               <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-xs font-bold">Terlaris</span>
               <span>•</span>
               <span>{product.category}</span>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
               <p className="text-4xl font-bold text-orange-600 mb-1">
                 Rp {product.price.toLocaleString("id-ID")}
               </p>
            </div>

            <div className="space-y-6 mb-8">
               <div className="flex items-start space-x-3">
                  <Store className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <Link href={`/shop/${product.sellerId}`} className="font-bold hover:text-orange-600 transition-colors">
                        {product.seller?.name || "UMKM Lokal"}
                    </Link>
                    <p className="text-sm text-muted-foreground">Produk dikirim dari UMKM terdekat</p>
                  </div>
               </div>
               
               <div className="flex items-start space-x-3">
                  <Package className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm">Stok Tersedia: <span className="font-bold">{product.stock}</span></p>
                  </div>
               </div>

               <div className="flex items-start space-x-3">
                  <Truck className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm">Pengiriman oleh <span className="font-bold text-green-600">Kurir Lokal Kita</span></p>
                    <p className="text-xs text-muted-foreground">Cepat, Aman, dan Langsung Sampai</p>
                  </div>
               </div>
            </div>

            <div className="flex gap-4 mt-auto">
               <AddToCartButton product={product} />
               <Button className="flex-1 bg-orange-600 h-14 text-lg">Beli Sekarang</Button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-16 border-t pt-12 max-w-4xl">
           <h2 className="text-2xl font-bold mb-6">Deskripsi Produk</h2>
           <div className="prose prose-orange max-w-none text-gray-600 leading-relaxed">
             {product.description || "Tidak ada deskripsi untuk produk ini."}
           </div>
        </div>
      </main>
    </div>
  );
}
