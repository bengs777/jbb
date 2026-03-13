"use client";

import { use, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader } from "@/components/ui/spinner";

export default function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        const res = await fetch(`/api/payment/status/${orderId}`);
        const json = await res.json();
        const url: string | null = json.data?.payment_url ?? null;

        if (url) {
          window.location.href = url;
          return;
        }

        // No valid URL → regenerate
        const regen = await fetch(`/api/payment/regenerate/${orderId}`, { method: "POST" });
        const regenJson = await regen.json();
        const newUrl: string | null = regenJson.data?.payment_url ?? null;
        if (newUrl) {
          window.location.href = newUrl;
        } else {
          setError(regenJson.message ?? "Gagal membuat link pembayaran.");
        }
      } catch {
        setError("Terjadi kesalahan jaringan. Coba lagi.");
      }
    };
    redirect();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">Pembayaran Gagal</p>
            <p className="text-xs text-slate-400 max-w-xs">{error}</p>
            <a href="/buyer/orders"
              className="mt-2 text-xs font-semibold text-primary hover:underline">
              Lihat Pesanan Saya
            </a>
          </>
        ) : (
          <>
            <PageLoader />
            <p className="text-sm text-slate-500">Mengalihkan ke halaman pembayaran&hellip;</p>
          </>
        )}
      </div>
    </div>
  );
}
