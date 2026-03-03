"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PageLoader } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  UserCheck, UserX, Store, Truck, Phone, MapPin, Mail, Clock,
  Camera, ClipboardList, Users,
} from "lucide-react";
import Image from "next/image";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  pending_role: string | null;
  apply_selfie_url: string | null;
  alamat: string | null;
  no_hp: string | null;
  created_at: string;
}

type Tab = "pending" | "seller" | "kurir";

export default function AdminSellersPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<Member[]>([]);
  const [sellers, setSellers] = useState<Member[]>([]);
  const [kurirs, setKurirs] = useState<Member[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [loadingKurirs, setLoadingKurirs] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPending = () => {
    setLoadingPending(true);
    fetch("/api/admin/users?pending_applications=true")
      .then((r) => r.json())
      .then((d) => setPending(d.data ?? []))
      .finally(() => setLoadingPending(false));
  };

  const fetchSellers = () => {
    setLoadingSellers(true);
    fetch("/api/admin/users?role=SELLER")
      .then((r) => r.json())
      .then((d) => setSellers(d.data ?? []))
      .finally(() => setLoadingSellers(false));
  };

  const fetchKurirs = () => {
    setLoadingKurirs(true);
    fetch("/api/admin/users?role=KURIR")
      .then((r) => r.json())
      .then((d) => setKurirs(d.data ?? []))
      .finally(() => setLoadingKurirs(false));
  };

  useEffect(() => { fetchPending(); }, []);

  useEffect(() => {
    if (tab === "seller" && sellers.length === 0) fetchSellers();
    if (tab === "kurir" && kurirs.length === 0) fetchKurirs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const approve = async (id: string, name: string, targetRole: string) => {
    setUpdating(id);
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, approve_pending: true }),
    });
    if (r.ok) {
      toast.success(`${name} diterima sebagai ${targetRole === "KURIR" ? "Kurir" : "Penjual"}`);
      fetchPending();
      // reset cache so active tabs refresh
      setSellers([]);
      setKurirs([]);
    } else {
      toast.error("Gagal menyetujui pengajuan");
    }
    setUpdating(null);
  };

  const reject = async (id: string, name: string) => {
    if (!confirm(`Tolak pengajuan dari ${name}?`)) return;
    setUpdating(id);
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, reject_pending: true }),
    });
    if (r.ok) {
      toast.success(`Pengajuan ${name} ditolak`);
      fetchPending();
    } else {
      toast.error("Gagal menolak pengajuan");
    }
    setUpdating(null);
  };

  const tabs: { key: Tab; label: string; count: number | null; color: string }[] = [
    { key: "pending", label: "Pengajuan", count: pending.length, color: "orange" },
    { key: "seller", label: "Penjual Aktif", count: sellers.length || null, color: "rose" },
    { key: "kurir", label: "Kurir Aktif", count: kurirs.length || null, color: "blue" },
  ];

  const tabColor: Record<string, string> = {
    orange: "bg-orange-500 text-white border-orange-500",
    rose: "bg-rose-500 text-white border-rose-500",
    blue: "bg-blue-500 text-white border-blue-500",
  };
  const tabInactive = "bg-white text-gray-500 border-gray-200 hover:border-gray-300";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-rose-600 via-red-600 to-orange-500 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Kelola Anggota</h1>
              <p className="text-red-100/80 text-sm mt-0.5">Pengajuan Penjual &amp; Kurir</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${tab === t.key ? tabColor[t.color] : tabInactive}`}
            >
              <span>{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span className={`mt-0.5 text-[10px] font-black ${tab === t.key ? "text-white/80" : "text-gray-400"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* --- TAB: PENDING --- */}
        {tab === "pending" && (
          <>
            {loadingPending ? (
              <div className="pt-16"><PageLoader /></div>
            ) : pending.length === 0 ? (
              <EmptyState icon={<UserCheck className="h-8 w-8 text-green-500" />} color="green"
                title="Semua Bersih!" desc="Tidak ada pengajuan yang menunggu persetujuan." />
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">{pending.length} pengajuan menunggu persetujuan</p>
                <div className="flex flex-col gap-3">
                  {pending.map((s) => (
                    <PendingCard
                      key={s.id} member={s}
                      loading={updating === s.id}
                      onApprove={() => approve(s.id, s.name, s.pending_role!)}
                      onReject={() => reject(s.id, s.name)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* --- TAB: SELLER --- */}
        {tab === "seller" && (
          <>
            {loadingSellers ? (
              <div className="pt-16"><PageLoader /></div>
            ) : sellers.length === 0 ? (
              <EmptyState icon={<Store className="h-8 w-8 text-orange-400" />} color="orange"
                title="Belum Ada Penjual" desc="Belum ada pengguna dengan peran Penjual." />
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">{sellers.length} penjual aktif terdaftar</p>
                <div className="flex flex-col gap-3">
                  {sellers.map((s) => <MemberCard key={s.id} member={s} accent="orange" />)}
                </div>
              </>
            )}
          </>
        )}

        {/* --- TAB: KURIR --- */}
        {tab === "kurir" && (
          <>
            {loadingKurirs ? (
              <div className="pt-16"><PageLoader /></div>
            ) : kurirs.length === 0 ? (
              <EmptyState icon={<Truck className="h-8 w-8 text-blue-400" />} color="blue"
                title="Belum Ada Kurir" desc="Belum ada pengguna dengan peran Kurir." />
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">{kurirs.length} kurir aktif terdaftar</p>
                <div className="flex flex-col gap-3">
                  {kurirs.map((s) => <MemberCard key={s.id} member={s} accent="blue" />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function EmptyState({ icon, color, title, desc }: {
  icon: React.ReactNode; color: string; title: string; desc: string;
}) {
  const bg: Record<string, string> = { green: "bg-green-100", orange: "bg-orange-100", blue: "bg-blue-100" };
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-8 text-center mt-2">
      <div className={`w-16 h-16 ${bg[color] ?? "bg-gray-100"} rounded-full flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}

function PendingCard({ member: s, loading, onApprove, onReject }: {
  member: Member; loading: boolean; onApprove: () => void; onReject: () => void;
}) {
  const isKurir = s.pending_role === "KURIR";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`h-1.5 ${isKurir ? "bg-gradient-to-r from-blue-400 to-cyan-500" : "bg-gradient-to-r from-orange-400 to-rose-500"}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isKurir ? "bg-blue-100" : "bg-orange-100"}`}>
              {isKurir ? <Truck className="h-5 w-5 text-blue-600" /> : <Store className="h-5 w-5 text-orange-600" />}
            </div>
            <div>
              <p className="font-bold text-gray-900">{s.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-400">Daftar {formatDate(s.created_at)}</p>
              </div>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isKurir ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
            Ingin jadi {isKurir ? "Kurir" : "Penjual"}
          </span>
        </div>

        <MemberInfo member={s} />

        {/* Selfie */}
        {s.apply_selfie_url ? (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" /> Foto Selfie Verifikasi
            </p>
            <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image src={s.apply_selfie_url} alt={`Selfie ${s.name}`} fill className="object-cover" />
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5">
            <Camera className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-700">Tidak ada foto selfie dilampirkan</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onApprove} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
            <UserCheck className="h-4 w-4" />
            Setujui sebagai {isKurir ? "Kurir" : "Penjual"}
          </button>
          <button onClick={onReject} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
            <UserX className="h-4 w-4" />
            Tolak
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member: s, accent }: { member: Member; accent: "orange" | "blue" }) {
  const isKurir = accent === "blue";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`h-1.5 ${isKurir ? "bg-gradient-to-r from-blue-400 to-cyan-500" : "bg-gradient-to-r from-orange-400 to-rose-500"}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isKurir ? "bg-blue-100" : "bg-orange-100"}`}>
              {isKurir ? <Truck className="h-5 w-5 text-blue-600" /> : <Store className="h-5 w-5 text-orange-600" />}
            </div>
            <div>
              <p className="font-bold text-gray-900">{s.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-400">Bergabung {formatDate(s.created_at)}</p>
              </div>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isKurir ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
            {isKurir ? "Kurir" : "Penjual"}
          </span>
        </div>
        <MemberInfo member={s} />
        {s.apply_selfie_url && (
          <div className="mt-1">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" /> Foto Selfie
            </p>
            <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <Image src={s.apply_selfie_url} alt={`Selfie ${s.name}`} fill className="object-cover" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MemberInfo({ member: s }: { member: Member }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4 pl-1">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span>{s.email}</span>
      </div>
      {s.no_hp && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span>{s.no_hp}</span>
        </div>
      )}
      {s.alamat && (
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
          <span>{s.alamat}</span>
        </div>
      )}
    </div>
  );
}
