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
    <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <Link href={`/katalog/${id}`}>
        <div className="relative h-44 bg-slate-50 overflow-hidden">
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
              <svg className="h-14 w-14 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {stok <= 5 && stok > 0 && (
            <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Sisa {stok}
            </div>
          )}
          {stok === 0 && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-slate-800/60 px-3 py-1 rounded-full">Habis</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-3">
        <span className="inline-block text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full mb-1.5">
          {kategori}
        </span>
        <Link href={`/katalog/${id}`}>
          <h3 className="font-semibold text-slate-800 text-sm leading-snug hover:text-blue-600 line-clamp-2 transition-colors">
            {nama}
          </h3>
        </Link>
        {seller_name && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">oleh {seller_name}</p>
        )}
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <span className="text-blue-700 font-bold text-base leading-none">{formatRupiah(harga)}</span>
          {onAddToCart && stok > 0 && (
            <button
              onClick={() => onAddToCart(id)}
              className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200"
              aria-label="Tambah ke keranjang"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
