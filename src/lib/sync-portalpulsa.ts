import { db } from "@/db";
import { topupProducts } from "@/db/schema";
import { getProducts, calculateSellPrice } from "@/lib/portalpulsa";

/**
 * Sync all products from PortalPulsa to local DB (overwrite existing).
 */
export async function syncPortalPulsaProducts() {
  const products = await getProducts();
  if (!products.length) throw new Error("No products fetched from PortalPulsa");

  // Prepare rows for DB
  const rows = products.map((p) => ({
    code: p.code,
    name: p.name,
    category: p.category,
    operator: p.operator,
    price: calculateSellPrice(p.price),
    cost: p.price,
    status: p.status as "available" | "empty",
  }));

  // Upsert all products
  await db.transaction(async (tx) => {
    // Optional: clear table first if you want a full overwrite
    // await tx.delete(topupProducts);
    for (const row of rows) {
      await tx.insert(topupProducts)
        .values(row)
        .onConflictDoUpdate({
          target: topupProducts.code,
          set: {
            name: row.name,
            category: row.category,
            operator: row.operator,
            price: row.price,
            cost: row.cost,
            status: row.status,
          },
        });
    }
  });

  return rows.length;
}
