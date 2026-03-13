"use client";

import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Banknote, 
  Settings, 
  Users,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    title: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Payout Requests",
    href: "/dashboard/admin/payouts",
    icon: Banknote,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      {/* Admin Secondary Header */}
      <header className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Admin Console</h2>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>Dashboard</span>
                  <ChevronRight className="w-3 h-3 mx-1" />
                  <span className="text-blue-600 font-medium capitalize">
                    {pathname.split("/").pop() || "Overview"}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex items-center gap-1 bg-muted p-1 rounded-xl">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    pathname === item.href
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  );
}
