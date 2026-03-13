import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateShort(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function getExpiredAt(minutes = 5): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function isExpired(expiredAt: string): boolean {
  return new Date() > new Date(expiredAt);
}

export function getRemainingSeconds(expiredAt: string): number {
  const diff = new Date(expiredAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

export function classifyEarnings(amount: number): "A" | "B" | "C" {
  if (amount >= 500000) return "A";
  if (amount >= 100000) return "B";
  return "C";
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800";
    case "UNPAID":
      return "bg-yellow-100 text-yellow-800";
    case "EXPIRED":
      return "bg-red-100 text-red-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case "MENUNGGU":
      return "bg-primary/10 text-primary";
    case "DIANTAR":
      return "bg-orange-100 text-orange-800";
    case "SELESAI":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function truncate(str: string, len = 50): string {
  return str.length > len ? str.substring(0, len) + "…" : str;
}

export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JBB-${ts}-${rand}`;
}
