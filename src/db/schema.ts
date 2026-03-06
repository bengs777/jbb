import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "boolean" }).default(false),
    image: text("image"),
    password_hash: text("password_hash"),
    role: text("role", { enum: ["BUYER", "SELLER", "KURIR", "ADMIN"] })
      .notNull()
      .default("BUYER"),
    is_active: integer("is_active", { mode: "boolean" }).default(true),
    alamat: text("alamat"),
    no_hp: text("no_hp"),
    pending_role: text("pending_role", { enum: ["SELLER", "KURIR"] }),
    apply_selfie_url: text("apply_selfie_url"),
    createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  })
);

// ─── BETTER AUTH TABLES ───────────────────────────────────────────────────────
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => ({
    userIdx: index("sessions_user_id_idx").on(t.userId),
    tokenIdx: index("sessions_token_idx").on(t.token),
  })
);

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    seller_id: text("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nama: text("nama").notNull(),
    deskripsi: text("deskripsi"),
    harga: integer("harga").notNull(),
    stok: integer("stok").notNull().default(0),
    kategori: text("kategori").notNull(),
    foto_url: text("foto_url"),
    status: text("status", { enum: ["ACTIVE", "INACTIVE"] })
      .notNull()
      .default("ACTIVE"),
    created_at: text("created_at").default(sql`(datetime('now'))`),
    updated_at: text("updated_at").default(sql`(datetime('now'))`),
  },
  (t) => ({
    sellerIdx: index("products_seller_id_idx").on(t.seller_id),
    kategoriIdx: index("products_kategori_idx").on(t.kategori),
    statusIdx: index("products_status_idx").on(t.status),
  })
);

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    buyer_id: text("buyer_id")
      .notNull()
      .references(() => users.id),
    seller_id: text("seller_id")
      .notNull()
      .references(() => users.id),
    kurir_id: text("kurir_id").references(() => users.id),
    nama_penerima: text("nama_penerima"),
    no_hp_penerima: text("no_hp_penerima"),
    alamat_pengiriman: text("alamat_pengiriman").notNull(),
    total_produk: integer("total_produk").notNull(),
    fee_kurir: integer("fee_kurir").notNull().default(1000),
    fee_admin: integer("fee_admin").notNull().default(500),
    total_bayar: integer("total_bayar").notNull(),
    status_pembayaran: text("status_pembayaran", {
      enum: ["UNPAID", "PAID", "EXPIRED", "CANCELLED"],
    })
      .notNull()
      .default("UNPAID"),
    status_pesanan: text("status_pesanan", {
      enum: ["MENUNGGU", "DIANTAR", "SELESAI"],
    })
      .notNull()
      .default("MENUNGGU"),
    qris_url: text("qris_url"),
    qris_id: text("qris_id"),
    expired_at: text("expired_at").notNull(),
    created_at: text("created_at").default(sql`(datetime('now'))`),
    updated_at: text("updated_at").default(sql`(datetime('now'))`),
  },
  (t) => ({
    buyerIdx: index("orders_buyer_id_idx").on(t.buyer_id),
    sellerIdx: index("orders_seller_id_idx").on(t.seller_id),
    kurirIdx: index("orders_kurir_id_idx").on(t.kurir_id),
    statusPembayaranIdx: index("orders_status_pembayaran_idx").on(t.status_pembayaran),
    expiredAtIdx: index("orders_expired_at_idx").on(t.expired_at),
  })
);

// ─── ORDER ITEMS ──────────────────────────────────────────────────────────────
export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_id: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id),
    qty: integer("qty").notNull(),
    harga: integer("harga").notNull(),
  },
  (t) => ({ orderIdx: index("order_items_order_id_idx").on(t.order_id) })
);

// ─── CART ITEMS ───────────────────────────────────────────────────────────────
export const cartItems = sqliteTable(
  "cart_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    product_id: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull().default(1),
    created_at: text("created_at").default(sql`(datetime('now'))`),
  },
  (t) => ({
    uniqueIdx: uniqueIndex("cart_items_unique_idx").on(t.user_id, t.product_id),
    userIdx: index("cart_items_user_id_idx").on(t.user_id),
  })
);

// ─── SELLER EARNINGS ──────────────────────────────────────────────────────────
export const sellerEarnings = sqliteTable(
  "seller_earnings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    seller_id: text("seller_id")
      .notNull()
      .references(() => users.id),
    order_id: text("order_id")
      .notNull()
      .unique()
      .references(() => orders.id),
    jumlah: integer("jumlah").notNull(),
    tanggal: text("tanggal").default(sql`(datetime('now'))`),
    klasifikasi: text("klasifikasi", { enum: ["A", "B", "C"] })
      .notNull()
      .default("C"),
  },
  (t) => ({
    sellerIdx: index("seller_earnings_seller_id_idx").on(t.seller_id),
    tanggalIdx: index("seller_earnings_tanggal_idx").on(t.tanggal),
  })
);

// ─── KURIR EARNINGS ───────────────────────────────────────────────────────────
export const kurirEarnings = sqliteTable(
  "kurir_earnings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    kurir_id: text("kurir_id")
      .notNull()
      .references(() => users.id),
    order_id: text("order_id")
      .notNull()
      .unique()
      .references(() => orders.id),
    fee_kurir: integer("fee_kurir").notNull(),
    tanggal: text("tanggal").default(sql`(datetime('now'))`),
    klasifikasi: text("klasifikasi", { enum: ["A", "B", "C"] })
      .notNull()
      .default("C"),
  },
  (t) => ({
    kurirIdx: index("kurir_earnings_kurir_id_idx").on(t.kurir_id),
    tanggalIdx: index("kurir_earnings_tanggal_idx").on(t.tanggal),
  })
);

// ─── PAYOUTS ──────────────────────────────────────────────────────────────────
export const payouts = sqliteTable(
  "payouts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["SELLER", "KURIR"] }).notNull(),
    jumlah: integer("jumlah").notNull(),
    nama_bank: text("nama_bank").notNull(),
    no_rekening: text("no_rekening").notNull(),
    nama_pemilik: text("nama_pemilik").notNull(),
    status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] })
      .notNull()
      .default("PENDING"),
    catatan_admin: text("catatan_admin"),
    created_at: text("created_at").default(sql`(datetime('now'))`),
    updated_at: text("updated_at").default(sql`(datetime('now'))`),
  },
  (t) => ({
    userIdx: index("payouts_user_id_idx").on(t.user_id),
    statusIdx: index("payouts_status_idx").on(t.status),
  })
);

// ─── TOPUP CATEGORIES ────────────────────────────────────────────────────────
/**
 * Cache produk dari PortalPulsa (TTL refresh tiap jam via cron).
 * Tidak di-foreign-key ke tabel lain, cukup bersifat lookup.
 */
export const topupProducts = sqliteTable(
  "topup_products",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(), // pulsa, data, pln, ewallet
    operator: text("operator").notNull(),
    price: integer("price").notNull(),     // harga jual (setelah markup 5%)
    cost: integer("cost").notNull(),       // harga modal dari PortalPulsa
    status: text("status").notNull().default("available"), // available | empty
    synced_at: text("synced_at").default(sql`(datetime('now'))`),
  },
  (t) => ({
    categoryIdx: index("topup_products_category_idx").on(t.category),
    operatorIdx: index("topup_products_operator_idx").on(t.operator),
  })
);

// ─── TOPUP TRANSACTIONS ───────────────────────────────────────────────────────
/**
 * Setiap permintaan top-up membuat 1 baris di sini.
 * Siklus status: PENDING → SUCCESS | FAILED | REFUNDED
 * Hold balance dilakukan saat PENDING, dikurangi saat SUCCESS, dikembalikan saat FAILED/REFUNDED.
 */
export const topupTransactions = sqliteTable(
  "topup_transactions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Identitas order
    invoice_id: text("invoice_id").notNull().unique(), // idempotency key (kita generate)
    product_code: text("product_code").notNull(),
    target_number: text("target_number").notNull(), // nomor tujuan / ID pelanggan PLN

    // Keuangan
    price: integer("price").notNull(),   // harga yang ditagihkan ke user
    cost: integer("cost").notNull(),     // modal ke PortalPulsa
    profit: integer("profit").notNull(), // price - cost (5%)

    // Pembayaran via Mayar (user top-up saldo dulu atau langsung bayar)
    mayar_payment_id: text("mayar_payment_id"),
    mayar_payment_url: text("mayar_payment_url"),
    mayar_paid_at: text("mayar_paid_at"),

    // Response PortalPulsa
    portalpulsa_trxid: text("portalpulsa_trxid"),
    portalpulsa_sn: text("portalpulsa_sn"), // Serial Number produk dari PP
    portalpulsa_rc: text("portalpulsa_rc"), // Response code PP
    portalpulsa_message: text("portalpulsa_message"),

    // State machine
    status: text("status", {
      enum: ["WAITING_PAYMENT", "PENDING", "SUCCESS", "FAILED", "REFUNDED"],
    })
      .notNull()
      .default("WAITING_PAYMENT"),
    failure_reason: text("failure_reason"),
    retry_count: integer("retry_count").notNull().default(0),

    created_at: text("created_at").default(sql`(datetime('now'))`),
    updated_at: text("updated_at").default(sql`(datetime('now'))`),
    expired_at: text("expired_at").notNull(),
  },
  (t) => ({
    userIdx: index("topup_trx_user_id_idx").on(t.user_id),
    statusIdx: index("topup_trx_status_idx").on(t.status),
    invoiceIdx: uniqueIndex("topup_trx_invoice_idx").on(t.invoice_id),
    ppTrxIdx: index("topup_trx_pp_trxid_idx").on(t.portalpulsa_trxid),
  })
);

// ─── BALANCE LEDGER ───────────────────────────────────────────────────────────
/**
 * Immutable append-only ledger — setiap mutasi saldo user dicatat di sini.
 * Saldo aktual user = SUM(amount) WHERE user_id = X.
 * Type: TOPUP_IN   = user bayar via Mayar (saldo masuk)
 *       ORDER_HOLD = hold saat submit top-up
 *       ORDER_DEBIT= debit saat PP konfirmasi sukses
 *       REFUND     = kembalikan hold jika PP gagal
 */
export const balanceLedger = sqliteTable(
  "balance_ledger",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topup_trx_id: text("topup_trx_id").references(() => topupTransactions.id),
    type: text("type", {
      enum: ["TOPUP_IN", "ORDER_HOLD", "ORDER_DEBIT", "REFUND", "ADMIN_ADJUST"],
    }).notNull(),
    amount: integer("amount").notNull(), // positif = masuk, negatif = keluar
    balance_after: integer("balance_after").notNull(),
    note: text("note"),
    created_at: text("created_at").default(sql`(datetime('now'))`),
  },
  (t) => ({
    userIdx: index("ledger_user_id_idx").on(t.user_id),
    trxIdx: index("ledger_topup_trx_id_idx").on(t.topup_trx_id),
    typeIdx: index("ledger_type_idx").on(t.type),
  })
);

// ─── USER BALANCE (denormalized cache) ────────────────────────────────────────
/**
 * Cache saldo user agar tidak perlu SUM ledger setiap request.
 * Selalu disinkronkan di dalam DB transaction yang sama dengan ledger insert.
 * balance_hold = jumlah yang sedang ditahan (PENDING orders).
 */
export const userBalances = sqliteTable("user_balances", {
  user_id: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),       // saldo tersedia
  balance_hold: integer("balance_hold").notNull().default(0), // on-hold
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
});

// ─── TYPE EXPORTS ─────────────────────────────────────────────────────────────
// ─── GAME ORDERS ─────────────────────────────────────────────────────────────
export const gameOrders = sqliteTable(
  "game_orders",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id, { onDelete: "set null" }),

    // Identitas game
    game_id: text("game_id").notNull(),          // ml, ff, pubg, dll
    game_name: text("game_name").notNull(),
    nominal_label: text("nominal_label").notNull(), // "86 Diamonds"
    nominal_value: text("nominal_value").notNull(), // "86"

    // Akun target
    target_user_id: text("target_user_id").notNull(),
    target_server_id: text("target_server_id"),

    // Keuangan
    amount: integer("amount").notNull(),

    // Idempotency + provider snapshot (audit-safe)
    idempotency_key: text("idempotency_key"),
    provider: text("provider").notNull().default("MAYAR"),
    provider_product_code: text("provider_product_code"),
    provider_buy_price: integer("provider_buy_price"),
    provider_sell_price: integer("provider_sell_price"),

    // Mayar payment
    invoice_id: text("invoice_id").notNull().unique(),
    mayar_payment_id: text("mayar_payment_id"),
    mayar_payment_url: text("mayar_payment_url"),
    mayar_paid_at: text("mayar_paid_at"),

    // Status
    status: text("status", {
      enum: ["WAITING_PAYMENT", "PAID", "FAILED", "EXPIRED"],
    }).notNull().default("WAITING_PAYMENT"),

    // Admin profit (sell_price - buy_price, ~5% margin)
    admin_profit: integer("admin_profit").notNull().default(0),

    // PortalPulsa delivery
    pp_trxid: text("pp_trxid"),
    pp_sn: text("pp_sn"),
    pp_rc: text("pp_rc"),
    pp_message: text("pp_message"),
    delivery_status: text("delivery_status", {
      enum: ["PENDING", "PROCESSING", "DELIVERED", "FAILED"],
    }).notNull().default("PENDING"),

    created_at: text("created_at").default(sql`(datetime('now'))`),
    updated_at: text("updated_at").default(sql`(datetime('now'))`),
    expired_at: text("expired_at").notNull(),
  },
  (t) => ({
    invoiceIdx: uniqueIndex("game_orders_invoice_idx").on(t.invoice_id),
    idempotencyIdx: uniqueIndex("game_orders_idempotency_idx").on(t.idempotency_key),
    userIdx: index("game_orders_user_id_idx").on(t.user_id),
    statusIdx: index("game_orders_status_idx").on(t.status),
  })
);

// ─── DIGITAL PRODUCTS (Provider Catalog) ────────────────────────────────────
export const digitalProducts = sqliteTable(
  "digital_products",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    provider: text("provider").notNull(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    game_id: text("game_id"),
    nominal_value: text("nominal_value"),
    buy_price: integer("buy_price").notNull(),
    sell_price: integer("sell_price").notNull(),
    margin_percent: integer("margin_percent").notNull().default(5),
    status: text("status", { enum: ["ACTIVE", "INACTIVE"] }).notNull().default("ACTIVE"),
    raw_payload: text("raw_payload"),
    updated_at: text("updated_at").default(sql`(datetime('now'))`),
  },
  (t) => ({
    providerIdx: index("digital_products_provider_idx").on(t.provider),
    statusIdx: index("digital_products_status_idx").on(t.status),
    gameIdx: index("digital_products_game_id_idx").on(t.game_id),
  })
);

// ─── MIKROTIK VOUCHERS ────────────────────────────────────────────────────────
export const mikrotikVouchers = sqliteTable(
  "mikrotik_vouchers",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    profile: text("profile").notNull(),
    price: integer("price").notNull().default(0),
    duration_hours: integer("duration_hours"),
    limit_bytes_total: integer("limit_bytes_total"),
    comment: text("comment"),
    status: text("status", { enum: ["unused", "used", "expired"] }).notNull().default("unused"),
    created_by: text("created_by").references(() => users.id, { onDelete: "set null" }),
    used_by_mac: text("used_by_mac"),
    used_at: text("used_at"),
    created_at: text("created_at").default(sql`(datetime('now'))`),
    updated_at: text("updated_at").default(sql`(datetime('now'))`),
  },
  (t) => ({
    statusIdx: index("mk_vouchers_status_idx").on(t.status),
    profileIdx: index("mk_vouchers_profile_idx").on(t.profile),
  })
);

// ─── WIFI ORDERS ─────────────────────────────────────────────────────────────
export const wifiOrders = sqliteTable(
  "wifi_orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id"),
    packet_id: text("packet_id").notNull(),
    packet_name: text("packet_name").notNull(),
    duration: text("duration").notNull(),
    amount: integer("amount").notNull(),
    invoice_id: text("invoice_id").notNull().unique(),
    mayar_payment_id: text("mayar_payment_id"),
    mayar_payment_url: text("mayar_payment_url"),
    mayar_paid_at: text("mayar_paid_at"),
    status: text("status", {
      enum: ["WAITING_PAYMENT", "PAID", "FAILED"],
    }).notNull().default("WAITING_PAYMENT"),
    voucher_username: text("voucher_username"),
    voucher_password: text("voucher_password"),
    expired_at: text("expired_at"),
    created_at: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => ({
    invoiceIdx: index("wifi_orders_invoice_idx").on(t.invoice_id),
    statusIdx: index("wifi_orders_status_idx").on(t.status),
  })
);

// ─── TYPE EXPORTS ─────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type SellerEarning = typeof sellerEarnings.$inferSelect;
export type KurirEarning = typeof kurirEarnings.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type TopupProduct = typeof topupProducts.$inferSelect;
export type TopupTransaction = typeof topupTransactions.$inferSelect;
export type NewTopupTransaction = typeof topupTransactions.$inferInsert;
export type BalanceLedger = typeof balanceLedger.$inferSelect;
export type UserBalance = typeof userBalances.$inferSelect;
export type GameOrder = typeof gameOrders.$inferSelect;
export type NewGameOrder = typeof gameOrders.$inferInsert;
export type DigitalProduct = typeof digitalProducts.$inferSelect;
export type NewDigitalProduct = typeof digitalProducts.$inferInsert;
export type MikrotikVoucher = typeof mikrotikVouchers.$inferSelect;
export type NewMikrotikVoucher = typeof mikrotikVouchers.$inferInsert;
export type WifiOrder = typeof wifiOrders.$inferSelect;
export type NewWifiOrder = typeof wifiOrders.$inferInsert;
