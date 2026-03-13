"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { User, Bell, Store, Truck, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CartSheet } from "@/components/CartSheet";

export function Navbar() {
  const { data: session } = useSession();
  const { items, setItems } = useCartStore();
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  useEffect(() => {
    if (session) {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => setItems(data));
      
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => setNotifications(data.filter((n: any) => !n.isRead)));
    }
  }, [session, setItems]);

  const unreadCount = notifications.length;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-orange-600">UMKM Kita</span>
        </Link>

        <div className="flex items-center space-x-4">
          <CartSheet />

          {session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-600 p-0" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    notifications.map((n: any) => (
                      <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3">
                        <span className="text-sm">{n.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem>Tidak ada notifikasi baru</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="w-full text-center text-xs text-orange-600">
                      Lihat Semua
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{session.user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{session.user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === "seller" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/seller" className="flex items-center text-orange-600">
                        <Store className="mr-2 h-4 w-4" />
                        Toko Saya
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {session.user.role === "courier" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/courier" className="flex items-center text-green-600">
                        <Truck className="mr-2 h-4 w-4" />
                        Pesanan Kurir
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Pengaturan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth">
              <Button className="bg-orange-600 hover:bg-orange-700">Masuk</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
