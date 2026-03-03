"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { formatRupiah, formatDate } from "@/lib/utils";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  WAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
  PENDING: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  WAITING_PAYMENT: "Menunggu Bayar",
  PENDING: "Diproses",
  SUCCESS: "Berhasil",
  FAILED: "Gagal",
  REFUNDED: "Dikembalikan",
};

export default function TopupHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/topup/transactions?page=${p}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data.data);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(page); }, [page]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/topup" className="text-indigo-600 hover:text-indigo-800">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-black text-gray-800">Riwayat Top-Up</h1>
          <button
            onClick={() => fetchTransactions(page)}
            className="ml-auto text-gray-400 hover:text-indigo-600"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-white animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-lg">Belum ada transaksi</p>
            <Link href="/topup" className="text-indigo-600 text-sm hover:underline mt-2 block">
              Lakukan top-up pertama →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((trx) => (
              <div key={trx.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {trx.product_code === "__DEPOSIT__"
                        ? "💰 Deposit Saldo"
                        : `📱 ${trx.product_code}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      {trx.target_number}
                    </p>
                    {trx.portalpulsa_sn && (
                      <p className="text-xs text-green-600 font-mono mt-0.5">
                        SN: {trx.portalpulsa_sn}
                      </p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">
                      {trx.created_at ? formatDate(trx.created_at) : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-800">
                      {formatRupiah(trx.price)}
                    </p>
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        STATUS_STYLES[trx.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[trx.status] ?? trx.status}
                    </span>
                  </div>
                </div>
                {trx.failure_reason && (
                  <p className="text-xs text-red-500 mt-2 border-t pt-2">
                    {trx.failure_reason}
                  </p>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40"
                >
                  ← Sebelumnya
                </button>
                <span className="text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40"
                >
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
