"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || "buyer",
      });
    }
  }, [session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name }),
      });

      if (res.ok) {
        toast.success("Profil berhasil diperbarui");
      } else {
        toast.error("Gagal memperbarui profil");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="mb-4">Silakan masuk untuk melihat profil Anda</p>
        <Button asChild className="bg-orange-600">
            <a href="/auth">Masuk</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profil Saya</h1>
          
          <div className="grid gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback className="text-2xl">
                    {session.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{session.user.name}</CardTitle>
                  <CardDescription className="capitalize">
                    {session.user.role} Marketplace UMKM Kita
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="name" 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="pl-10" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="email" 
                        value={profile.email} 
                        disabled 
                        className="pl-10 bg-gray-50" 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email tidak dapat diubah untuk saat ini.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role Pengguna</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        id="role" 
                        value={profile.role.toUpperCase()} 
                        disabled 
                        className="pl-10 bg-gray-50 capitalize" 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Role Anda sudah ditetapkan saat mendaftar.</p>
                  </div>

                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Simpan Perubahan"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informasi Akun</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">Bergabung sejak:</span>
                  <span className="font-medium">
                    {new Date(session.user.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
