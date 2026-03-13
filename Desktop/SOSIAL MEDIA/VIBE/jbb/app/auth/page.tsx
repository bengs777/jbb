"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ShoppingBag, 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowLeft,
  Store,
  Truck,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    try {
      const { data, error } = await signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        await fetch('/api/profile', {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
        toast.success("Akun berhasil dibuat!");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Email atau password salah");
      } else {
        toast.success("Berhasil masuk!");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-orange-600 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-black/40" />
        <Image
          src="https://images.unsplash.com/photo-1609130983702-f2e25b21e302?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzQ0MDd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlY29tbWVyY2UlMjBzaG9wcGluZyUyMGJhZ3MlMjBoYXBweSUyMHBlb3BsZSUyMGluZG9uZXNpYW58ZW58MHwwfHx8MTc2ODkzNDQ5NXww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Shopping background"
          fill
          className="object-cover"
          priority
        />
        
        <div className="relative z-20 flex flex-col justify-between p-12 text-white h-full w-full">
          <div>
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-white p-2 rounded-xl">
                <ShoppingBag className="h-8 w-8 text-orange-600" />
              </div>
              <span className="text-3xl font-bold">UMKM Kita</span>
            </Link>
          </div>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Mulai Langkah Suksesmu Bersama UMKM Lokal.
            </h1>
            <p className="text-xl text-gray-200">
              Platform tepercaya untuk mendukung ekonomi kreatif Indonesia. Bergabunglah dengan ribuan pelaku usaha lainnya.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <div className="bg-orange-500 p-3 rounded-full">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold">Transaksi Aman & Tepercaya</p>
              <p className="text-sm text-gray-300">Data Anda dilindungi dengan enkripsi standar industri.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-orange-600 p-2 rounded-lg">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-orange-600">UMKM Kita</span>
            </Link>
          </div>

          <div className="space-y-2">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-orange-600 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali ke Beranda
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-gray-500">Silakan masuk atau daftar untuk melanjutkan pengalaman belanja Anda.</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-gray-100 rounded-xl">
              <TabsTrigger 
                value="signin" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 font-medium"
              >
                Masuk
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 font-medium"
              >
                Daftar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="signin-email" 
                      name="email" 
                      type="email" 
                      placeholder="contoh@email.com" 
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="signin-password" className="text-sm font-semibold text-gray-700">Password</Label>
                    <Link href="#" className="text-xs font-medium text-orange-600 hover:underline">Lupa password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="signin-password" 
                      name="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
                      required 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 transition-all active:scale-[0.98]" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Masuk Sekarang"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-semibold text-gray-700">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="signup-name" 
                      name="name" 
                      type="text" 
                      placeholder="John Doe" 
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="signup-email" 
                      name="email" 
                      type="email" 
                      placeholder="contoh@email.com" 
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="signup-password" 
                      name="password" 
                      type="password" 
                      placeholder="Minimal 8 karakter" 
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
                      required 
                      minLength={8} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Daftar Sebagai</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all peer-checked:border-orange-600 peer-checked:bg-orange-50 [&:has(input:checked)]:border-orange-600 [&:has(input:checked)]:bg-orange-50">
                      <input type="radio" name="role" value="buyer" className="sr-only" defaultChecked />
                      <UserCircle className="h-6 w-6 mb-2 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">Pembeli</span>
                    </label>
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all [&:has(input:checked)]:border-orange-600 [&:has(input:checked)]:bg-orange-50">
                      <input type="radio" name="role" value="seller" className="sr-only" />
                      <Store className="h-6 w-6 mb-2 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">Penjual</span>
                    </label>
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all [&:has(input:checked)]:border-orange-600 [&:has(input:checked)]:bg-orange-50">
                      <input type="radio" name="role" value="courier" className="sr-only" />
                      <Truck className="h-6 w-6 mb-2 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">Kurir</span>
                    </label>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 transition-all active:scale-[0.98]" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Buat Akun UMKM"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="pt-6 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400">
                Dengan melanjutkan, Anda menyetujui <Link href="#" className="underline">Ketentuan Layanan</Link> dan <Link href="#" className="underline">Kebijakan Privasi</Link> UMKM Kita.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
