import { z } from "zod";

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["BUYER", "SELLER", "KURIR"]).default("BUYER"),
  alamat: z.string().optional(),
  no_hp: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
});

// ─── PRODUCT ──────────────────────────────────────────────────────────────────
export const createProductSchema = z.object({
  nama: z.string().min(2, "Nama produk minimal 2 karakter").max(200),
  deskripsi: z.string().optional(),
  harga: z.number().int().positive("Harga harus lebih dari 0"),
  stok: z.number().int().min(0, "Stok tidak boleh negatif"),
  kategori: z.string().min(1, "Kategori wajib diisi"),
  foto_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateProductSchema = createProductSchema.partial();

// ─── ORDER ────────────────────────────────────────────────────────────────────
export const cartItemSchema = z.object({
  product_id: z.string().min(1),
  qty: z.number().int().positive("Qty minimal 1"),
});

export const checkoutSchema = z.object({
  nama_penerima: z.string().min(2, "Nama penerima minimal 2 karakter"),
  no_hp_penerima: z.string().min(8, "Nomor HP minimal 8 digit"),
  alamat_pengiriman: z.string().min(5, "Alamat pengiriman minimal 5 karakter"),
  items: z.array(cartItemSchema).min(1, "Keranjang tidak boleh kosong"),
});

export const updateOrderStatusSchema = z.object({
  status_pesanan: z.enum(["MENUNGGU", "DIANTAR", "SELESAI"]),
});

export const assignKurirSchema = z.object({
  kurir_id: z.string().min(1),
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const activateUserSchema = z.object({
  user_id: z.string().min(1),
  is_active: z.boolean(),
});

export const updateUserRoleSchema = z.object({
  user_id: z.string().min(1),
  role: z.enum(["BUYER", "SELLER", "KURIR", "ADMIN"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
