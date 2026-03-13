"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, Package, ShoppingBag, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SellerProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    category: "Makanan",
  });

  const fetchProducts = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/products?sellerId=${session.user.id}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.user.role !== 'seller') {
       router.push('/dashboard');
    }
    fetchProducts();
  }, [session]);

  const handleEdit = (p: any) => {
    setFormData({
      name: p.name,
      description: p.description || "",
      price: p.price.toString(),
      stock: p.stock.toString(),
      imageUrl: p.imageUrl || "",
      category: p.category,
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Produk berhasil dihapus");
        fetchProducts();
      } else {
        toast.error("Gagal menghapus produk");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan");
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: "", description: "", price: "", stock: "", imageUrl: "", category: "Makanan" });
        fetchProducts();
      } else {
        toast.error("Gagal menyimpan produk");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", description: "", price: "", stock: "", imageUrl: "", category: "Makanan" });
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Kelola Produk Toko</h1>
            <p className="text-muted-foreground">Tambah, edit, atau hapus produk UMKM Anda.</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-8 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? "Edit Produk" : "Tambah Produk Baru"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={cancelForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Kripik Tempe Renyah" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <select 
                      id="category" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Makanan</option>
                      <option>Minuman</option>
                      <option>Kerajinan</option>
                      <option>Fashion</option>
                      <option>Lainnya</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Harga (Rp)</Label>
                      <Input id="price" type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="15000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stok</Label>
                      <Input id="stock" type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea id="description" className="min-h-[120px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ceritakan tentang keunggulan produk Anda..." />
                  </div>
                </div>
                
                <div className="space-y-4">
                   <Label>Foto Produk</Label>
                   <ImageUpload 
                     route="images" 
                     value={formData.imageUrl} 
                     onChange={(url) => setFormData({...formData, imageUrl: url})} 
                   />
                   <div className="flex gap-4 pt-4">
                     <Button type="button" variant="outline" onClick={cancelForm} className="flex-1 h-12">
                       Batal
                     </Button>
                     <Button type="submit" disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 h-12">
                       {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                       {editingId ? "Perbarui Produk" : "Simpan Produk"}
                     </Button>
                   </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : products.length > 0 ? (
            products.map((p: any) => (
              <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                <div className="relative aspect-video">
                  <Image src={p.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e"} alt={p.name} fill className="object-cover" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-gray-800 hover:bg-white">{p.category}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                   <h3 className="font-bold text-lg truncate mb-1">{p.name}</h3>
                   <div className="flex items-center justify-between">
                     <p className="text-orange-600 font-bold">Rp {p.price.toLocaleString()}</p>
                     <p className="text-sm text-muted-foreground">Stok: {p.stock}</p>
                   </div>
                </CardContent>
                <div className="flex border-t divide-x">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleEdit(p)}
                    className="flex-1 rounded-none h-12 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex-1 rounded-none h-12 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus <strong>{p.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-red-600 hover:bg-red-700">
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed">
               <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
               <p className="text-gray-500">Anda belum memiliki produk.</p>
               <Button onClick={() => setShowForm(true)} variant="link" className="text-orange-600 mt-2">
                 Tambah produk pertama Anda
               </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
