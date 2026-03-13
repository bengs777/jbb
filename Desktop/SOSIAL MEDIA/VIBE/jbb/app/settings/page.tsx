"use client";

import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Lock, Globe, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    promo: false,
  });

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
        <p className="mb-4">Silakan masuk untuk mengakses pengaturan</p>
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
          <h1 className="text-3xl font-bold mb-8">Pengaturan</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <CardTitle>Notifikasi</CardTitle>
                </div>
                <CardDescription>Atur bagaimana Anda ingin menerima pembaruan dari UMKM Kita.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Email</Label>
                    <p className="text-sm text-muted-foreground">Terima status pesanan dan kuitansi via email.</p>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={(v) => setNotifications({ ...notifications, email: v })} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Push</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi instan di peramban Anda.</p>
                  </div>
                  <Switch 
                    checked={notifications.push} 
                    onCheckedChange={(v) => setNotifications({ ...notifications, push: v })} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Promo & Penawaran</Label>
                    <p className="text-sm text-muted-foreground">Terima info diskon dari UMKM lokal favorit.</p>
                  </div>
                  <Switch 
                    checked={notifications.promo} 
                    onCheckedChange={(v) => setNotifications({ ...notifications, promo: v })} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-orange-600" />
                  <CardTitle>Keamanan</CardTitle>
                </div>
                <CardDescription>Kelola keamanan akun dan akses Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Ganti Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Otentikasi Dua Faktor (2FA)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-orange-600" />
                  <CardTitle>Preferensi</CardTitle>
                </div>
                <CardDescription>Atur preferensi tampilan dan bahasa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Bahasa</Label>
                  <Button variant="ghost">Bahasa Indonesia</Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mata Uang</Label>
                  <Button variant="ghost">IDR (Rp)</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-600">Zona Bahaya</CardTitle>
                </div>
                <CardDescription>Tindakan yang tidak dapat dibatalkan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Akun Selamanya
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
