import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-slate-100 text-slate-600 ring-slate-200/60",
  success:  "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  warning:  "bg-amber-50  text-amber-700  ring-amber-200/60",
  danger:   "bg-red-50    text-red-600    ring-red-200/60",
  info:     "bg-blue-50   text-blue-700   ring-blue-200/60",
  purple:   "bg-violet-50 text-violet-700 ring-violet-200/60",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Payment status badge
export function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    PAID: { label: "Dibayar", variant: "success" },
    UNPAID: { label: "Belum Bayar", variant: "warning" },
    EXPIRED: { label: "Kadaluarsa", variant: "danger" },
    CANCELLED: { label: "Dibatalkan", variant: "default" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

// Order status badge
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    MENUNGGU: { label: "Menunggu", variant: "info" },
    DIANTAR: { label: "Diantar", variant: "warning" },
    SELESAI: { label: "Selesai", variant: "success" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

// User role badge
export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    ADMIN: { label: "Admin", variant: "danger" },
    SELLER: { label: "Seller", variant: "purple" },
    KURIR: { label: "Kurir", variant: "info" },
    BUYER: { label: "Pembeli", variant: "success" },
  };
  const { label, variant } = map[role] ?? { label: role, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

// Earnings classification badge
export function ClassBadge({ kelas, klasifikasi }: { kelas?: string; klasifikasi?: string }) {
  const val = kelas ?? klasifikasi ?? "";
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    A: { label: "Kelas A ⭐", variant: "success" },
    B: { label: "Kelas B", variant: "warning" },
    C: { label: "Kelas C", variant: "default" },
  };
  const { label, variant } = map[val] ?? { label: val, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}
