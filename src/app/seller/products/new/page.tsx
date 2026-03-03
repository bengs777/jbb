"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import toast from "react-hot-toast";
import { Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

const KATEGORI = ["Sembako", "Sayuran", "Buah", "Daging & Ikan", "Bumbu", "Minuman", "Snack", "Lainnya"];

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nama: "", deskripsi: "", harga: "", stok: "", kategori: "Sembako",
    foto_url: "", status: "ACTIVE",
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Maksimal 2MB"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok) { setForm(f => ({ ...f, foto_url: d.url })); toast.success("Foto berhasil diupload"); }
      else toast.error(d.error || "Upload gagal");
    } catch { toast.error("Upload gagal"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.harga || !form.stok) { toast.error("Lengkapi form"); return; }
    setLoading(true);
    const r = await fetch("/api/seller/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, harga: Number(form.harga), stok: Number(form.stok) }),
    });
    const d = await r.json();
    if (r.ok) { toast.success("Produk berhasil ditambahkan!"); router.push("/seller/products"); }
    else toast.error(d.error || "Gagal menambahkan produk");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/seller/products" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Tambah Produk</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto Produk</label>
            {form.foto_url && (
              <img src={form.foto_url} alt="preview" className="w-full h-48 object-cover rounded-xl mb-2" />
            )}
            <label className="flex items-center gap-2 justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-green-400 transition-colors">
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">{uploading ? "Mengupload..." : "Upload foto (maks 2MB)"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            <p className="text-xs text-gray-400 mt-1">Atau isi URL foto:</p>
            <Input placeholder="https://..." value={form.foto_url} onChange={set("foto_url")} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
            <Input placeholder="Beras 5kg Premium" value={form.nama} onChange={set("nama")} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <Textarea placeholder="Deskripsi produk..." value={form.deskripsi} onChange={set("deskripsi")} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
              <Input type="number" min="0" placeholder="50000" value={form.harga} onChange={set("harga")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok *</label>
              <Input type="number" min="0" placeholder="100" value={form.stok} onChange={set("stok")} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <Select value={form.kategori} onChange={set("kategori")}>
                {KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select value={form.status} onChange={set("status")}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading || uploading}>
            {loading ? "Menyimpan..." : "Tambah Produk"}
          </Button>
        </form>
      </div>
    </div>
  );
}
