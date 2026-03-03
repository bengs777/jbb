import { db } from "./index";
import {
  users,
  sessions,
  accounts,
  verifications,
  products,
  orders,
  orderItems,
  cartItems,
  sellerEarnings,
  kurirEarnings,
} from "./schema";

async function clearAll() {
  console.log("🗑️  Menghapus semua data...");

  // Delete in FK-safe order (children first)
  await db.delete(kurirEarnings);
  await db.delete(sellerEarnings);
  await db.delete(orderItems);
  await db.delete(cartItems);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(verifications);
  await db.delete(accounts);
  await db.delete(sessions);
  await db.delete(users);

  console.log("✅ Semua akun dan data berhasil dihapus!");
}

clearAll().catch(console.error);
