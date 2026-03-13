"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "@/lib/auth-client";
import { PageLoader } from "@/components/ui/spinner";
import { RoleBadge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { User, Lock, Trash2, ChevronRight, AlertTriangle, Mail, Store, Truck, Clock, CheckCircle2, Camera, X } from "lucide-react";

type Section = "profile" | "password" | "delete" | "apply" | null;

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [section, setSection] = useState<Section>(null);

  // Profile form
  const [name, setName] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Delete form
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Apply role form
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [applySelfieUrl, setApplySelfieUrl] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [applyTarget, setApplyTarget] = useState<"SELLER" | "KURIR" | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        setName(d.data?.name ?? "");
        setNoHp(d.data?.no_hp ?? "");
        setAlamat(d.data?.alamat ?? "");
        setHasPassword(d.data?.has_password ?? true);
      });
    fetch("/api/user/apply")
      .then((r) => r.json())
      .then((d) => {
        setPendingRole(d.data?.pending_role ?? null);
        setApplySelfieUrl(d.data?.apply_selfie_url ?? null);
      });
  }, [session]);

  const handleProfileSave = async () => {
    setProfileLoading(true);
    const r = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, no_hp: noHp, alamat }),
    });
    const d = await r.json();
    if (r.ok) { toast.success("Profil diperbarui!"); setSection(null); }
    else toast.error(d.error ?? "Gagal memperbarui profil");
    setProfileLoading(false);
  };

  const handlePasswordChange = async () => {
    if (newPw !== confirmPw) { toast.error("Konfirmasi password tidak cocok"); return; }
    setPwLoading(true);
    const body: Record<string, string> = { new_password: newPw };
    if (hasPassword) body.current_password = currentPw;
    const r = await fetch("/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (r.ok) {
      toast.success(d.data?.message ?? "Password berhasil diubah!");
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setSection(null);
      setHasPassword(true);
      if (hasPassword) setTimeout(() => signOut(), 1500);
    } else {
      toast.error(d.error ?? "Gagal mengubah password");
    }
    setPwLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "HAPUS AKUN") {
      toast.error('Ketik "HAPUS AKUN" untuk konfirmasi');
      return;
    }
    setDeleteLoading(true);
    const r = await fetch("/api/user/profile", { method: "DELETE" });
    if (r.ok) {
      toast.success("Akun berhasil dihapus.");
      await signOut();
      router.push("/");
    } else {
      toast.error("Gagal menghapus akun");
      setDeleteLoading(false);
    }
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("File harus berupa gambar"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran file maksimal 5 MB"); return; }

    // preview
    const reader = new FileReader();
    reader.onload = (ev) => setSelfiePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setSelfieUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/user/selfie", { method: "POST", body: fd });
    const d = await r.json();
    if (r.ok) {
      setApplySelfieUrl(d.url);
      toast.success("Foto berhasil diunggah");
    } else {
      toast.error(d.error ?? "Upload gagal");
      setSelfiePreview(null);
    }
    setSelfieUploading(false);
  };

  const handleApply = async (targetRole: "SELLER" | "KURIR") => {
    if (!applySelfieUrl) { toast.error("Unggah foto selfie terlebih dahulu"); return; }
    setApplyLoading(true);
    const r = await fetch("/api/user/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_role: targetRole, selfie_url: applySelfieUrl }),
    });
    const d = await r.json();
    if (r.ok) {
      toast.success(d.data?.message ?? "Pengajuan terkirim!");
      setPendingRole(targetRole);
      setApplyTarget(null);
      setSection(null);
    } else {
      toast.error(d.error ?? "Gagal mengirim pengajuan");
    }
    setApplyLoading(false);
  };

  const handleCancelApply = async () => {
    setApplyLoading(true);
    const r = await fetch("/api/user/apply", { method: "DELETE" });
    if (r.ok) {
      toast.success("Pengajuan dibatalkan");
      setPendingRole(null);
      setApplySelfieUrl(null);
      setSelfiePreview(null);
      setApplyTarget(null);
    } else {
      toast.error("Gagal membatalkan pengajuan");
    }
    setApplyLoading(false);
  };

  if (isPending) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="pt-24"><PageLoader /></div></div>;

  const role = (session?.user as { role?: string })?.role ?? "BUYER";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
          <h1 className="text-2xl font-black tracking-tight">Pengaturan Akun</h1>
          <p className="text-slate-300 text-sm mt-1">Kelola profil dan keamanan akun Anda</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 pb-28 md:pb-12">
        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{session?.user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3 w-3 text-gray-400" />
              <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
            </div>
            <div className="mt-1"><RoleBadge role={role} /></div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden mb-4">
          {/* Edit Profil */}
          <button
            onClick={() => setSection(section === "profile" ? null : "profile")}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-800 text-sm">Edit Profil</p>
              <p className="text-xs text-gray-500">Ubah nama, nomor HP, dan alamat</p>
            </div>
            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${section === "profile" ? "rotate-90" : ""}`} />
          </button>

          {section === "profile" && (
            <div className="px-4 pb-4 pt-2 border-b border-gray-100 bg-primary/5">
              <div className="flex flex-col gap-3">
                <Input
                  label="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                />
                <Input
                  label="No. HP"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
                <Input
                  label="Alamat"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Desa No. XX"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setSection(null)}
                    className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <Button onClick={handleProfileSave} loading={profileLoading} className="flex-1">
                    Simpan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Ganti / Buat Password */}
          <button
            onClick={() => setSection(section === "password" ? null : "password")}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-800 text-sm">{hasPassword ? "Ganti Password" : "Buat Password"}</p>
              <p className="text-xs text-gray-500">
                {hasPassword ? "Perbarui kata sandi akun Anda" : "Tambahkan password agar bisa login dengan email"}
              </p>
            </div>
            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${section === "password" ? "rotate-90" : ""}`} />
          </button>

          {section === "password" && (
            <div className="px-4 pb-4 pt-2 bg-primary/5">
              <div className="flex flex-col gap-3">
                {!hasPassword && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-primary">
                    Akun Anda terdaftar via Google. Buat password untuk bisa login dengan email &amp; password.
                  </div>
                )}
                {hasPassword && (
                  <Input
                    label="Password Saat Ini"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••"
                  />
                )}
                <Input
                  label="Password Baru"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 6 karakter"
                />
                <Input
                  label="Konfirmasi Password Baru"
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Ulangi password baru"
                />
                <p className="text-xs text-gray-500">
                  {hasPassword
                    ? "Setelah ganti password, Anda akan logout otomatis."
                    : "Setelah membuat password, Anda bisa login dengan email & password."}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setSection(null)}
                    className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <Button onClick={handlePasswordChange} loading={pwLoading} className="flex-1">
                    Ubah Password
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ajukan Diri — hanya untuk BUYER */}
        {role === "BUYER" && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden mb-4">
            <button
              onClick={() => setSection(section === "apply" ? null : "apply")}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-800 text-sm">Ajukan Diri</p>
                <p className="text-xs text-gray-500">
                  {pendingRole
                    ? `Mengajukan diri sebagai ${pendingRole === "KURIR" ? "Kurir" : "Penjual"} — menunggu admin`
                    : "Daftar sebagai Penjual atau Kurir"}
                </p>
              </div>
              {pendingRole ? (
                <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Pending
                </span>
              ) : (
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${section === "apply" ? "rotate-90" : ""}`} />
              )}
            </button>

            {section === "apply" && (
              <div className="px-4 pb-4 pt-2 bg-primary/5">
                {pendingRole ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                      <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700">
                        Pengajuan Anda sebagai <strong>{pendingRole === "KURIR" ? "Kurir" : "Penjual"}</strong> sedang ditinjau oleh admin. Anda akan mendapat konfirmasi setelah diproses.
                      </p>
                    </div>
                    {applySelfieUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={applySelfieUrl} alt="Selfie pengajuan" className="w-full h-40 object-cover" />
                        <p className="text-xs text-center text-gray-500 py-1.5 bg-gray-50">Foto selfie pengajuan Anda</p>
                      </div>
                    )}
                    <button
                      onClick={handleCancelApply}
                      disabled={applyLoading}
                      className="w-full py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {applyLoading ? "Membatalkan..." : "Batalkan Pengajuan"}
                    </button>
                  </div>
                ) : !applyTarget ? (
                  // Step 1: pilih peran
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-gray-500">Pilih peran yang ingin Anda ajukan:</p>
                    <div
                      onClick={() => setApplyTarget("SELLER")}
                      className="flex items-center gap-3 p-4 border-2 border-primary/20 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Penjual (Seller)</p>
                        <p className="text-xs text-gray-500">Jual produk Anda di platform JBB</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setApplyTarget("KURIR")}
                      className="flex items-center gap-3 p-4 border-2 border-primary/20 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Kurir</p>
                        <p className="text-xs text-gray-500">Antarkan pesanan dan dapatkan penghasilan</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Step 2: upload selfie + konfirmasi
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <button onClick={() => setApplyTarget(null)} className="p-1 rounded-lg hover:bg-gray-100">
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                      <p className="text-sm font-semibold text-gray-700">
                        Pengajuan sebagai {applyTarget === "KURIR" ? "Kurir" : "Penjual"}
                      </p>
                    </div>

                    {/* Selfie upload */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        <Camera className="h-3.5 w-3.5" /> Foto Selfie <span className="text-red-500">*</span>
                      </p>
                      <p className="text-xs text-gray-500 mb-3">Ambil atau unggah foto selfie Anda yang jelas untuk verifikasi identitas.</p>

                      {selfiePreview || applySelfieUrl ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-primary/40 mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selfiePreview ?? applySelfieUrl ?? ""}
                            alt="Preview selfie"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            onClick={() => { setSelfiePreview(null); setApplySelfieUrl(null); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                          >
                            <X className="h-3.5 w-3.5 text-white" />
                          </button>
                          {applySelfieUrl && !selfieUploading && (
                            <div className="absolute bottom-2 right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Terunggah
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <Camera className={`h-8 w-8 ${selfieUploading ? "text-primary animate-pulse" : "text-gray-400"}`} />
                          <span className="text-sm text-gray-500">{selfieUploading ? "Mengunggah..." : "Pilih foto selfie"}</span>
                          <span className="text-xs text-gray-400">JPG / PNG, maks. 5 MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            className="hidden"
                            onChange={handleSelfieUpload}
                            disabled={selfieUploading}
                          />
                        </label>
                      )}
                    </div>

                    <button
                      onClick={() => handleApply(applyTarget)}
                      disabled={applyLoading || selfieUploading || !applySelfieUrl}
                      className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {applyLoading ? "Mengirim..." : `Kirim Pengajuan sebagai ${applyTarget === "KURIR" ? "Kurir" : "Penjual"}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info untuk SELLER/KURIR */}
        {(role === "SELLER" || role === "KURIR") && (
          <div className="bg-primary/10 rounded-2xl ring-1 ring-primary/20 p-4 mb-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-primary">
              Anda terdaftar sebagai <strong>{role === "SELLER" ? "Penjual" : "Kurir"}</strong>. Akses fitur lengkap dari menu navigasi.
            </p>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-red-100 overflow-hidden">
          <button
            onClick={() => setSection(section === "delete" ? null : "delete")}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50/50 transition-colors"
          >
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-red-600 text-sm">Hapus Akun</p>
              <p className="text-xs text-gray-500">Hapus permanen semua data akun Anda</p>
            </div>
            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${section === "delete" ? "rotate-90" : ""}`} />
          </button>

          {section === "delete" && (
            <div className="px-4 pb-4 pt-2 bg-red-50/40">
              <div className="bg-red-100 border border-red-200 rounded-xl p-3 mb-4 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                  <strong>Tindakan ini tidak dapat dibatalkan.</strong> Seluruh data Anda termasuk riwayat pesanan, produk, dan saldo akan dihapus secara permanen.
                </p>
              </div>
              <Input
                label={'Ketik "HAPUS AKUN" untuk konfirmasi'}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="HAPUS AKUN"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setSection(null); setDeleteConfirm(""); }}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirm !== "HAPUS AKUN"}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? "Menghapus..." : "Hapus Akun"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
