import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700 border border-gray-200",
  success: "bg-green-100 text-green-700 border border-green-200",
  warning: "bg-amber-100 text-amber-700 border border-amber-200",
  danger: "bg-red-100 text-red-700 border border-red-200",
  info: "bg-primary/10 text-primary border border-primary/20",
  purple: "bg-primary text-white border border-primary",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full",
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
    PAID: { label: "DIBAYAR", variant: "success" },
    UNPAID: { label: "BELUM BAYAR", variant: "warning" },
    EXPIRED: { label: "KADALUARSA", variant: "danger" },
    CANCELLED: { label: "DIBATALKAN", variant: "default" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

// Order status badge
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    MENUNGGU: { label: "MENUNGGU", variant: "info" },
    DIANTAR: { label: "DIANTAR", variant: "warning" },
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
