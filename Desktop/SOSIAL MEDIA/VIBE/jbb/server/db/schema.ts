import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Better Auth tables with admin plugin support
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  image: text("image"),
  role: text("role").default("buyer"), // Roles: buyer, seller, courier, admin
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// UMKM Marketplace Tables
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  sellerId: text("seller_id").notNull().references(() => user.id),
  category: text("category").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  externalId: text("external_id").notNull().unique(), // Our internal order ID for Pakasir
  buyerId: text("buyer_id").notNull().references(() => user.id),
  sellerId: text("seller_id").notNull().references(() => user.id),
  courierId: text("courier_id").references(() => user.id),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, processed, shipping, completed, cancelled
  
  // Pakasir fields
  paymentNumber: text("payment_number"),
  paymentMethod: text("payment_method"),
  totalPayment: integer("total_payment"),
  paymentFee: integer("payment_fee"),
  paymentExpiredAt: integer("payment_expired_at", { mode: "timestamp" }),
  
  paidAt: integer("paid_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),
});

export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  type: text("type").notNull(), // order_paid, order_shipping, order_completed, etc.
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const payoutRequests = sqliteTable("payout_requests", {
  id: text("id").primaryKey(),
  sellerId: text("seller_id").notNull().references(() => user.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, rejected
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  adminNote: text("admin_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Relations
export const userRelations = relations(user, ({ many }) => ({
  products: many(products),
  ordersAsBuyer: many(orders, { relationName: "buyer" }),
  ordersAsSeller: many(orders, { relationName: "seller" }),
  ordersAsCourier: many(orders, { relationName: "courier" }),
  notifications: many(notifications),
  payoutRequests: many(payoutRequests),
}));

export const payoutRequestsRelations = relations(payoutRequests, ({ one }) => ({
  seller: one(user, {
    fields: [payoutRequests.sellerId],
    references: [user.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  seller: one(user, {
    fields: [products.sellerId],
    references: [user.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(user, {
    fields: [orders.buyerId],
    references: [user.id],
    relationName: "buyer",
  }),
  seller: one(user, {
    fields: [orders.sellerId],
    references: [user.id],
    relationName: "seller",
  }),
  courier: one(user, {
    fields: [orders.courierId],
    references: [user.id],
    relationName: "courier",
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(user, {
    fields: [cartItems.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));
