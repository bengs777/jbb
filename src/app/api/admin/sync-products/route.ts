import { NextRequest } from "next/server";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { digitalProducts } from "@/db/schema";
import { requireRole, ok, err } from "@/lib/api-helpers";
import { ApiGamesError, calculateSellPrice, getAllProducts } from "@/lib/apigames";
import { logger } from "@/lib/logger";

const PROVIDER = "APIGAMES";
const MARGIN_PERCENT = 5;

export async function POST(req: NextRequest) {
  const guard = requireRole(req, "ADMIN");
  if ("status" in guard) return guard;

  const startedAt = Date.now();

  try {
    const products = await getAllProducts();
    const now = new Date().toISOString();


    // Validasi dan logging produk yang tidak valid
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    for (const product of products) {
      if (!product.code || !product.name || !product.buyPrice) {
        logger.error("[apigames] produk tidak valid, skip", { product });
        invalidRows.push(product);
        continue;
      }
      validRows.push({
        id: crypto.randomUUID(),
        provider: PROVIDER,
        code: product.code,
        name: product.name,
        game_id: product.gameId,
        nominal_value: product.nominalValue,
        buy_price: product.buyPrice,
        sell_price: calculateSellPrice(product.buyPrice),
        margin_percent: MARGIN_PERCENT,
        status: product.status,
        raw_payload: JSON.stringify(product.raw),
        updated_at: now,
      });
    }

    const allCodes = validRows.map((r) => r.code);

    await db.transaction(async (tx) => {
      for (const row of validRows) {
        await tx
          .insert(digitalProducts)
          .values(row)
          .onConflictDoUpdate({
            target: digitalProducts.code,
            set: {
              provider: row.provider,
              name: row.name,
              game_id: row.game_id,
              nominal_value: row.nominal_value,
              buy_price: row.buy_price,
              sell_price: row.sell_price,
              margin_percent: row.margin_percent,
              status: row.status,
              raw_payload: row.raw_payload,
              updated_at: row.updated_at,
            },
          });
      }

      if (allCodes.length > 0) {
        await tx
          .update(digitalProducts)
          .set({ status: "INACTIVE", updated_at: now })
          .where(
            and(
              eq(digitalProducts.provider, PROVIDER),
              notInArray(digitalProducts.code, allCodes)
            )
          );
      }
    });

    logger.info("[admin/sync-products] sync complete", {
      userId: guard.user.id,
      provider: PROVIDER,
      count: validRows.length,
      invalidCount: invalidRows.length,
      durationMs: Date.now() - startedAt,
    });

    return ok({
      provider: PROVIDER,
      synced: validRows.length,
      marginPercent: MARGIN_PERCENT,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    if (error instanceof ApiGamesError) {
      logger.error("[admin/sync-products] apigames error", {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });
      // Tampilkan error detail ke client (dev only, aman untuk debugging)
      return err(
        `Sync gagal: ${error.message} (${error.code})${error.meta ? " | " + JSON.stringify(error.meta) : ""}`,
        502
      );
    }

    logger.error("[admin/sync-products] unexpected error", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Tampilkan error detail ke client (dev only, aman untuk debugging)
    return err(
      "Gagal sinkronisasi produk: " +
        (error instanceof Error ? error.message : String(error)),
      500
    );
  }
}
