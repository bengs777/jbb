/**
 * Seed script: npm run db:seed
 * Creates demo accounts + sample products
 */
import "dotenv/config";
import { db } from "./index";
import { users, products, accounts } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID as uuidv4 } from "crypto";

const DEMO_USERS = [
  { name: "Admin JBB", email: "admin@jbb.desa", password: "admin123", role: "ADMIN" as const },
  { name: "Toko Makmur", email: "toko@jbb.desa", password: "seller123", role: "SELLER" as const },
  { name: "Kurir Cepat", email: "kurir@jbb.desa", password: "kurir123", role: "KURIR" as const },
  { name: "Pembeli Setia", email: "pembeli@jbb.desa", password: "buyer123", role: "BUYER" as const },
];

const DEMO_PRODUCTS = [
  { nama: "Beras Premium 5kg", deskripsi: "Beras pulen kualitas terbaik pilihan petani lokal", harga: 65000, stok: 50, kategori: "Sembako", foto_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80" },
  { nama: "Minyak Goreng 1L", deskripsi: "Minyak goreng kemasan 1 liter, jernih dan bebas kolesterol", harga: 18000, stok: 100, kategori: "Sembako", foto_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" },
  { nama: "Gula Pasir 1kg", deskripsi: "Gula pasir putih bersih, manis alami", harga: 14000, stok: 80, kategori: "Sembako", foto_url: "https://images.unsplash.com/photo-1581450024842-a0a2bf94e940?w=400&q=80" },
  { nama: "Bayam Segar", deskripsi: "Bayam organik segar dari kebun, kaya zat besi", harga: 5000, stok: 30, kategori: "Sayuran", foto_url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80" },
  { nama: "Tomat Merah 1kg", deskripsi: "Tomat segar merah matang dari kebun lokal", harga: 8000, stok: 40, kategori: "Sayuran", foto_url: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400&q=80" },
  { nama: "Pisang Cavendish", deskripsi: "Pisang manis-asam segar, 1 sisir", harga: 12000, stok: 20, kategori: "Buah", foto_url: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80" },
  { nama: "Tempe Blok 200g", deskripsi: "Tempe homemade organik kedelai lokal", harga: 7000, stok: 25, kategori: "Daging & Ikan", foto_url: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80" },
  { nama: "Telur Ayam 1kg", deskripsi: "Telur ayam kampung segar, kaya protein", harga: 28000, stok: 60, kategori: "Sembako", foto_url: "https://images.unsplash.com/photo-1518569656558-1f25e69d2221?w=400&q=80" },
];

async function seed() {
  console.log("🌱 Seeding JBB database...");

  // Create users
  const userIds: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, u.email));
    if (existing.length) {
      console.log(`  ⏭️  User ${u.email} already exists`);
      userIds[u.role] = existing[0].id;
      continue;
    }
    const id = uuidv4();
    const hash = await bcrypt.hash(u.password, 12);
    await db.insert(users).values({
      id,
      name: u.name,
      email: u.email,
      emailVerified: true,
      password_hash: hash,
      role: u.role,
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userIds[u.role] = id;
    // Create Better Auth credential account so login works
    const hash2 = await bcrypt.hash(u.password, 12);
    await db.insert(accounts).values({
      id: uuidv4(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: hash2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`  ✅ Created ${u.role}: ${u.email} / ${u.password}`);
  }

  // Create products (owned by seller)
  const sellerId = userIds["SELLER"];
  if (sellerId) {
    for (const p of DEMO_PRODUCTS) {
      const existing = await db.select().from(products).where(eq(products.nama, p.nama));
      if (existing.length) { console.log(`  ⏭️  Product "${p.nama}" exists`); continue; }
      await db.insert(products).values({
        id: uuidv4(),
        seller_id: sellerId,
        status: "ACTIVE",
        ...p,
      });
      console.log(`  ✅ Product: ${p.nama}`);
    }
  }

  console.log("\n🎉 Seed selesai!");
  console.log("\n📋 Demo accounts:");
  DEMO_USERS.forEach(u => console.log(`   ${u.role.padEnd(8)} ${u.email} / ${u.password}`));
  process.exit(0);
}

seed().catch(e => { console.error("❌ Seed error:", e); process.exit(1); });
