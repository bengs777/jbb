"use client";

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">😵</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-slate-600 mb-6">
          Maaf, halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>
    </div>
  )
}