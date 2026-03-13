import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { digitalProducts } from "@/db/schema";
import { logger } from "@/lib/logger";

const PROVIDER = "APIGAMES";

export async function GET(req: NextRequest) {
  try {
    const gameId = req.nextUrl.searchParams.get("gameId")?.trim().toLowerCase() || null;

    const whereClause = gameId
      ? and(
          eq(digitalProducts.provider, PROVIDER),
          eq(digitalProducts.status, "ACTIVE"),
          eq(digitalProducts.game_id, gameId)
        )
      : and(eq(digitalProducts.provider, PROVIDER), eq(digitalProducts.status, "ACTIVE"));

    const rows = await db
      .select({
        code: digitalProducts.code,
        name: digitalProducts.name,
        game_id: digitalProducts.game_id,
        nominal_value: digitalProducts.nominal_value,
        buy_price: digitalProducts.buy_price,
        sell_price: digitalProducts.sell_price,
        margin_percent: digitalProducts.margin_percent,
      })
      .from(digitalProducts)
      .where(whereClause)
      .orderBy(digitalProducts.game_id, digitalProducts.sell_price, digitalProducts.name);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    logger.error("[games/products] failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: "Gagal mengambil produk game" }, { status: 500 });
  }
}
