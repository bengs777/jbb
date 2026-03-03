"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInactive = searchParams.get("error") === "inactive";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/buyer" });
    } catch {
      toast.error("Gagal login dengan Google.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= 5) {
      toast.error("Terlalu banyak percobaan. Coba lagi nanti.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.email({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (result.error) {
        setAttempts((p) => p + 1);
        toast.error("Email atau password salah");
        return;
      }

      // Redirect based on role
      const user = result.data?.user as { role?: string } | undefined;
      const role = user?.role ?? "BUYER";

      toast.success("Selamat datang kembali!");

      const roleRedirect: Record<string, string> = {
        BUYER: "/buyer",
        SELLER: "/seller",
        KURIR: "/kurir",
        ADMIN: "/admin",
      };

      router.push(roleRedirect[role] ?? "/katalog");
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="JBB Logo" width={76} height={76} className="drop-shadow-md" priority />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm shadow-slate-200 border border-slate-100 p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">Masuk ke JBB</h1>
          <p className="text-sm text-slate-500 mb-6">
            Belum punya akun?{" "}
            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
              Daftar gratis
            </Link>
          </p>

          {isInactive && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Akun Anda belum diaktifkan oleh Admin. Hubungi admin desa.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@desa.id"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Password Anda"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
              Masuk
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Login aman dengan sesi terenkripsi</span>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">atau</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Mengarahkan..." : "Lanjutkan dengan Google"}
          </button>
        </div>


      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
