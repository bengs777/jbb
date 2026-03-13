"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader } from "@/components/ui/spinner";
import { Wifi, WifiOff, RefreshCw, UserX, Plus, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

interface ActiveUser {
  ".id": string;
  name: string;
  address: string;
  "mac-address": string;
  uptime: string;
  "bytes-in": string;
  "bytes-out": string;
  comment?: string;
}

interface Voucher {
  id: string;
  code: string;
  profile: string;
  price: number;
  status: "unused" | "used" | "expired";
  used_by_mac?: string | null;
  used_at?: string | null;
  created_at: string;
}

function formatBytes(bytes: string | number) {
  const n = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (isNaN(n) || n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function MikrotikPage() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kicking, setKicking] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "vouchers">("active");
  const [error, setError] = useState<string | null>(null);

  const fetchActive = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/mikrotik/active", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setActiveUsers(json.data ?? []);
        setError(null);
      } else {
        setError(json.error ?? "Gagal memuat data aktif");
      }
    } catch {
      setError("Gagal menghubungi server");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  const fetchVouchers = useCallback(async () => {
    const res = await fetch("/api/admin/mikrotik/vouchers", { cache: "no-store" });
    const json = await res.json();
    if (json.success) setVouchers(json.data ?? []);
  }, []);

  useEffect(() => {
    fetchActive();
    fetchVouchers();
    const interval = setInterval(() => fetchActive(true), 15_000);
    return () => clearInterval(interval);
  }, [fetchActive, fetchVouchers]);

  const handleKick = async (id: string, name: string) => {
    if (!confirm(`Kick user "${name}" dari hotspot?`)) return;
    setKicking(id);
    try {
      const res = await fetch("/api/admin/mikrotik/active", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`User ${name} telah dikick`);
        setActiveUsers((prev) => prev.filter((u) => u[".id"] !== id));
      } else {
        toast.error(json.error ?? "Gagal kick user");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setKicking(null);
    }
  };

  const unusedVouchers = vouchers.filter((v) => v.status === "unused").length;
  const usedVouchers = vouchers.filter((v) => v.status === "used").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="bg-primary text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
          <Link href="/admin" className="flex items-center gap-1.5 text-primary-foreground/60 text-sm mb-4 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">MikroTik Manager</h1>
              <p className="text-primary-foreground/60 text-sm">Hotspot voucher & monitoring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-24 md:pb-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-primary leading-none">{activeUsers.length}</p>
            <p className="text-xs text-gray-400 mt-1">Online</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-green-600 leading-none">{unusedVouchers}</p>
            <p className="text-xs text-gray-400 mt-1">Voucher Tersedia</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-gray-500 leading-none">{usedVouchers}</p>
            <p className="text-xs text-gray-400 mt-1">Terpakai</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 mb-4">
          {(["active", "vouchers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {t === "active" ? "Pengguna Aktif" : "Voucher"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="pt-8"><PageLoader /></div>
        ) : (
          <>
            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <WifiOff className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Koneksi MikroTik gagal</p>
                  <p className="text-xs text-red-500 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {tab === "active" && (
              <div className="card">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <p className="font-semibold text-sm text-gray-900">
                    {activeUsers.length} pengguna online
                  </p>
                  <button
                    onClick={() => fetchActive()}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                {activeUsers.length === 0 ? (
                  <div className="py-12 text-center">
                    <Wifi className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Tidak ada pengguna aktif</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {activeUsers.map((u) => (
                      <div key={u[".id"]} className="flex items-center gap-3 p-4">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Wifi className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{u["mac-address"]}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-gray-400">↑ {formatBytes(u["bytes-out"])}</span>
                            <span className="text-xs text-gray-400">↓ {formatBytes(u["bytes-in"])}</span>
                            <span className="text-xs text-blue-500">{u.uptime}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleKick(u[".id"], u.name)}
                          disabled={kicking === u[".id"]}
                          className="flex items-center gap-1 text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 disabled:opacity-50 transition-colors flex-shrink-0"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Kick
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "vouchers" && (
              <div>
                <Link
                  href="/admin/mikrotik/generate"
                  className="flex items-center justify-center gap-2 bg-primary text-white font-semibold text-sm py-3 rounded-xl mb-4 hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Buat Voucher Baru
                </Link>
                <div className="card">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-900">Riwayat Voucher</p>
                  </div>
                  {vouchers.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-gray-400 text-sm">Belum ada voucher dibuat</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {vouchers.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 p-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono font-bold text-gray-900">{v.code}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{v.profile}</p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                              v.status === "unused"
                                ? "bg-green-100 text-green-700"
                                : v.status === "used"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {v.status === "unused" ? "Tersedia" : v.status === "used" ? "Terpakai" : "Expired"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
