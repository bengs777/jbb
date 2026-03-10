"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu, X, LogOut, ShoppingCart, LayoutGrid, Gamepad2,
  Package, Settings, LayoutDashboard, ShoppingBag, Truck,
  Users, BarChart2, ClipboardList, Smartphone,
} from "lucide-react";
import Image from "next/image";
import { RoleBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: React.ReactNode };

const roleLinks: Record<string, NavLink[]> = {
  BUYER: [
    { href: "/topup",        label: "Top-Up",     icon: <Smartphone  className="h-5 w-5" /> },
    { href: "/katalog",      label: "Katalog",    icon: <LayoutGrid  className="h-5 w-5" /> },
    { href: "/games",        label: "Game",       icon: <Gamepad2    className="h-5 w-5" /> },
    { href: "/buyer/cart",   label: "Keranjang",  icon: <ShoppingCart className="h-5 w-5" /> },
    { href: "/buyer/orders", label: "Pesanan",    icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/settings",     label: "Pengaturan", icon: <Settings    className="h-5 w-5" /> },
  ],
  SELLER: [
    { href: "/katalog",          label: "Katalog",    icon: <LayoutGrid    className="h-5 w-5" /> },
    { href: "/games",            label: "Game",       icon: <Gamepad2      className="h-5 w-5" /> },
    { href: "/seller",           label: "Dashboard",  icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/seller/products",  label: "Produk",     icon: <Package       className="h-5 w-5" /> },
    { href: "/seller/orders",    label: "Pesanan",    icon: <ShoppingBag   className="h-5 w-5" /> },
    { href: "/settings",         label: "Pengaturan", icon: <Settings      className="h-5 w-5" /> },
  ],
  KURIR: [
    { href: "/kurir",        label: "Dashboard",  icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/kurir/orders", label: "Pengiriman", icon: <Truck           className="h-5 w-5" /> },
    { href: "/settings",     label: "Pengaturan", icon: <Settings        className="h-5 w-5" /> },
  ],
  ADMIN: [
    { href: "/admin",          label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/admin/users",    label: "Users",     icon: <Users           className="h-5 w-5" /> },
    { href: "/admin/orders",   label: "Orders",    icon: <ShoppingBag     className="h-5 w-5" /> },
    { href: "/admin/earnings", label: "Laporan",   icon: <BarChart2       className="h-5 w-5" /> },
    { href: "/settings",       label: "Pengaturan",icon: <Settings        className="h-5 w-5" /> },
  ],
};

const BOTTOM_NAV_MAX = 4;

export function Navbar() {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  const role = (session?.user as { role?: string })?.role ?? "BUYER";

  useEffect(() => {
    if (!session || role !== "BUYER") return;
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d) => {
        const items: { qty: number }[] = d.data ?? [];
        setCartCount(items.reduce((sum, i) => sum + i.qty, 0));
      })
      .catch(() => {});
  }, [session, role]);

  const links: NavLink[] = session
    ? roleLinks[role] ?? []
    : [
        { href: "/katalog", label: "Katalog", icon: <LayoutGrid  className="h-5 w-5" /> },
        { href: "/games",   label: "Game",    icon: <Gamepad2    className="h-5 w-5" /> },
      ];

  const bottomLinks = links.slice(0, BOTTOM_NAV_MAX);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Top Navbar ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-primary text-white border-b border-primary/70 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-primary/95">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <Image src="/logo.png" alt="JBB" width={40} height={40} className="rounded-md ring-2 ring-white/35 shadow" />
              <span className="font-semibold text-white tracking-tight text-xl hidden sm:inline drop-shadow-sm">
                Jual Beli Buntu
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={link.label}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-md border",
                      active
                        ? "bg-white text-primary border-white shadow-sm"
                        : "text-white/95 border-transparent hover:bg-black/15 hover:border-white/30"
                    )}
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    <span className="hidden lg:inline whitespace-nowrap">{link.label}</span>
                    {link.href === "/buyer/cart" && cartCount > 0 && (
                      <span className="min-w-[20px] h-[20px] bg-white text-primary text-xs font-bold rounded-full flex items-center justify-center px-1 ring-1 ring-primary/10">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="hidden md:flex items-center gap-3">
              {isPending ? (
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
              ) : session ? (
                <div className="flex items-center gap-3">
                  <RoleBadge role={role} />
                  <span className="text-sm font-semibold text-white/95 truncate max-w-32 hidden lg:inline">
                    {session.user.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-white bg-black/10 hover:bg-black/20 border border-white/20 rounded-md transition-all duration-200"
                    title="Logout"
                    suppressHydrationWarning={true}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white bg-black/10 hover:bg-black/20 border border-white/20 rounded-md transition-all duration-200">
                    Masuk
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-semibold text-primary bg-white hover:bg-gray-50 border border-white rounded-md transition-all duration-200 shadow-sm">
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile right — quick login + hamburger */}
            <div className="md:hidden flex items-center gap-1">
              {session && role === "BUYER" && (
                <Link
                  href="/buyer/cart"
                  className="relative p-3 text-white bg-black/10 hover:bg-black/20 border border-white/20 rounded-md transition-all duration-200"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-white text-primary text-xs font-bold rounded-full flex items-center justify-center px-1 ring-1 ring-primary/10">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              )}
              {!session && !isPending && (
                <Link href="/login" className="px-3 py-2 text-sm font-semibold text-white bg-black/10 hover:bg-black/20 border border-white/20 rounded-md transition-all duration-200">
                  Masuk
                </Link>
              )}
              <button
                onClick={() => setOpen((o) => !o)}
                className="p-3 text-white bg-black/10 hover:bg-black/20 border border-white/20 rounded-md transition-all duration-200"
                aria-label="Toggle menu"
                suppressHydrationWarning={true}
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Slide-Down Menu */}
          {open && (
            <div className="md:hidden pb-4 border-t border-black/10 mt-2 bg-white shadow-lg rounded-b-md">
              <div className="flex flex-col gap-1 pt-3">
                {links.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4 text-base font-semibold rounded-md transition-all duration-200 border",
                        active
                          ? "bg-primary text-white border-primary"
                          : "text-gray-700 border-transparent hover:bg-gray-100"
                      )}
                    >
                      <span className={cn("flex-shrink-0", active ? "text-white" : "text-slate-400")}>
                        {link.icon}
                      </span>
                      {link.label}
                      {link.href === "/buyer/cart" && cartCount > 0 && (
                        <span className="ml-auto min-w-[20px] h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="border-t border-slate-100 mt-1 pt-1">
                  {!session ? (
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl text-center mt-1 shadow-sm shadow-primary/20"
                    >
                      Buat Akun Gratis
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <RoleBadge role={role} />
                        <span className="text-sm text-slate-700 font-medium truncate max-w-40">
                          {session.user.name}
                        </span>
                      </div>
                      <button
                        onClick={() => { signOut(); setOpen(false); }}
                        className="flex-shrink-0 flex items-center gap-1 text-sm text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-xl"
                        suppressHydrationWarning={true}
                      >
                        <LogOut className="h-4 w-4" /> Keluar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Bottom Nav Bar (mobile only, logged-in) ──────────────── */}
      {session && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-slate-200/70 shadow-[0_-1px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-stretch justify-around" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            {bottomLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-14 text-[10px] font-semibold transition-all",
                    active ? "text-primary" : "text-slate-400 active:bg-slate-50"
                  )}
                >
                  <span className={cn("transition-transform duration-150", active ? "scale-110" : "")}>
                    {link.icon}
                  </span>
                  <span className={active ? "text-primary" : ""}>{link.label}</span>
                  {link.href === "/buyer/cart" && cartCount > 0 && (
                    <span className="absolute top-1.5 left-1/2 translate-x-1 min-w-[16px] h-4 bg-primary text-white text-[8px] font-medium rounded-full flex items-center justify-center px-1">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
            {links.length > BOTTOM_NAV_MAX && (
              <button
                onClick={() => setOpen((o) => !o)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-14 text-[10px] font-semibold transition-colors",
                  open ? "text-primary" : "text-slate-400 active:bg-slate-50"
                )}
                suppressHydrationWarning={true}
              >
                <Menu className="h-5 w-5" />
                <span>Lainnya</span>
              </button>
            )}
          </div>
        </nav>
      )}

      {/* ── Guest bottom bar ─────────────────────────────────────── */}
      {!session && !isPending && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-gray-200 px-4 py-2 flex gap-2 shadow-md">
          <Link href="/login"    className="flex-1 text-center py-2.5 text-sm font-semibold text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors">
            Masuk
          </Link>
          <Link href="/register" className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-hover transition-colors shadow-sm">
            Daftar Gratis
          </Link>
        </div>
      )}
    </>
  );
}
