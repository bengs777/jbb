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
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/70 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <Image src="/logo.png" alt="JBB" width={34} height={34} className="drop-shadow-sm" />
              <span className="font-black text-blue-700 tracking-tight hidden sm:inline">
                Jual Beli Buntu
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={link.label}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                    )}
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    <span className="hidden lg:inline whitespace-nowrap">{link.label}</span>
                    {link.href === "/buyer/cart" && cartCount > 0 && (
                      <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="hidden md:flex items-center gap-2">
              {isPending ? (
                <div className="h-8 w-20 skeleton rounded-lg" />
              ) : session ? (
                <div className="flex items-center gap-2">
                  <RoleBadge role={role} />
                  <span className="text-sm text-slate-700 font-medium truncate max-w-28 hidden lg:inline">
                    {session.user.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                    Masuk
                  </Link>
                  <Link href="/register" className="px-3.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-100">
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
                  className="relative p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              )}
              {!session && !isPending && (
                <Link href="/login" className="px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-xl">
                  Masuk
                </Link>
              )}
              <button
                onClick={() => setOpen((o) => !o)}
                className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                aria-label="Toggle menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Slide-Down Menu */}
          {open && (
            <div className="md:hidden pb-3 border-t border-slate-100 mt-1 animate-fade-up">
              <div className="flex flex-col gap-0.5 pt-2">
                {links.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all",
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                      )}
                    >
                      <span className={cn("flex-shrink-0", active ? "text-white" : "text-slate-400")}>
                        {link.icon}
                      </span>
                      {link.label}
                      {link.href === "/buyer/cart" && cartCount > 0 && (
                        <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
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
                      className="block px-3 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl text-center mt-1 shadow-sm shadow-blue-200"
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
                    active ? "text-blue-600" : "text-slate-400 active:bg-slate-50"
                  )}
                >
                  <span className={cn("transition-transform duration-150", active ? "scale-110" : "")}>
                    {link.icon}
                  </span>
                  <span className={active ? "text-blue-600" : ""}>{link.label}</span>
                  {link.href === "/buyer/cart" && cartCount > 0 && (
                    <span className="absolute top-1.5 left-1/2 translate-x-1 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-1">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
            {links.length > BOTTOM_NAV_MAX && (
              <button
                onClick={() => setOpen((o) => !o)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-14 text-[10px] font-semibold transition-colors",
                  open ? "text-blue-600" : "text-slate-400 active:bg-slate-50"
                )}
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-slate-200/70 px-4 py-2 flex gap-2 shadow-[0_-1px_20px_rgba(0,0,0,0.06)]">
          <Link href="/login"    className="flex-1 text-center py-2.5 text-sm font-semibold text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
            Masuk
          </Link>
          <Link href="/register" className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100">
            Daftar Gratis
          </Link>
        </div>
      )}
    </>
  );
}
