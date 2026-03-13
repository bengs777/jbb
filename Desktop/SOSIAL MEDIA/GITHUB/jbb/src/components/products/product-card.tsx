import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  foto_url?: string | null;
  kategori: string;
  seller_name?: string;
  onAddToCart?: (id: string) => void;
}

export function ProductCard({
  id, nama, harga, stok, foto_url, kategori, seller_name, onAddToCart,
}: ProductCardProps) {
  return (
    <div className="card group">
      {/* Image */}
      <Link href={`/katalog/${id}`}>
        <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-md">
          {foto_url ? (
            <Image
              src={foto_url}
              alt={nama}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {stok <= 5 && stok > 0 && (
            <div className="absolute top-3 right-3 badge">
              SISA {stok}
            </div>
          )}
          {stok === 0 && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-t-md">
              <span className="text-white font-semibold text-lg bg-primary px-4 py-2 rounded-md">HABIS</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <span className="inline-block text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-md mb-3">
          {kategori}
        </span>
        <Link href={`/katalog/${id}`}>
          <h3 className="font-semibold text-gray-900 text-lg leading-tight hover:text-primary p-2 rounded-md transition-colors duration-200 line-clamp-2">
            {nama}
          </h3>
        </Link>
        {seller_name && (
          <p className="text-sm font-medium text-gray-600 mt-2">Oleh {seller_name}</p>
        )}
        <div className="flex items-center justify-between mt-4 gap-3">
          <span className="text-white font-semibold text-xl bg-primary px-3 py-2 rounded-md">{formatRupiah(harga)}</span>
          {onAddToCart && stok > 0 && (
            <button
              onClick={() => onAddToCart(id)}
              className="flex-shrink-0 p-3 btn-primary rounded-md"
              aria-label="Tambah ke keranjang"
            >
              <ShoppingCart className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
