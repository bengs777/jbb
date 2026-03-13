/**
 * Balance Engine
 * Semua mutasi saldo user HARUS melalui fungsi di file ini agar:
 * 1. Ledger selalu in-sync dengan user_balances (atomic transaction)
 * 2. Tidak ada saldo negatif
 * 3. Double-processing terhindar karena pakai DB transaction
 */

import { db } from "@/db";
import type { DB } from "@/db";
import { balanceLedger, userBalances } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

export type LedgerType = "TOPUP_IN" | "ORDER_HOLD" | "ORDER_DEBIT" | "REFUND" | "ADMIN_ADJUST";

interface MutationParams {
  userId: string;
  amount: number;         // positif = masuk, negatif = keluar
  type: LedgerType;
  note?: string;
  topupTrxId?: string;
}

type DbTx = Parameters<DB["transaction"]>[0] extends (tx: infer T) => Promise<unknown> ? T : never;

export async function mutatBalanceInTransaction(tx: DbTx, params: MutationParams): Promise<number> {
  const { userId, amount, type, note, topupTrxId } = params;

  await tx
    .insert(userBalances)
    .values({ user_id: userId, balance: 0, balance_hold: 0 })
    .onConflictDoNothing();

  const [bal] = await tx
    .select({ balance: userBalances.balance, hold: userBalances.balance_hold })
    .from(userBalances)
    .where(eq(userBalances.user_id, userId));

  const current = bal?.balance ?? 0;
  const currentHold = bal?.hold ?? 0;

  if (type === "ORDER_HOLD") {
    if (current + amount < 0) {
      throw new Error("INSUFFICIENT_BALANCE");
    }
  }
  if (type === "ORDER_DEBIT") {
    if (currentHold + amount < 0) {
      throw new Error("INSUFFICIENT_HOLD_BALANCE");
    }
  }

  const balanceAfter = current + amount;

  let newHold = currentHold;
  if (type === "ORDER_HOLD") newHold = currentHold + Math.abs(amount);
  if (type === "ORDER_DEBIT") newHold = Math.max(0, currentHold - Math.abs(amount));
  if (type === "REFUND") newHold = Math.max(0, currentHold - Math.abs(amount));

  await tx
    .update(userBalances)
    .set({
      balance: balanceAfter,
      balance_hold: newHold,
      updated_at: new Date().toISOString(),
    })
    .where(eq(userBalances.user_id, userId));

  await tx.insert(balanceLedger).values({
    user_id: userId,
    topup_trx_id: topupTrxId ?? null,
    type,
    amount,
    balance_after: balanceAfter,
    note: note ?? null,
  });

  logger.info("[balance] mutation", {
    userId,
    type,
    amount,
    balanceAfter,
    topupTrxId,
  });

  return balanceAfter;
}

/**
 * Mutasi saldo dalam satu DB transaction.
 * Throw jika saldo tidak mencukupi untuk debit.
 *
 * @returns balance_after setelah mutasi
 */
export async function mutatBalance(params: MutationParams): Promise<number> {
  return await db.transaction(async (tx) => {
    return mutatBalanceInTransaction(tx, params);
  });
}

/**
 * Ambil saldo user (buat tampil di UI).
 */
export async function getBalance(userId: string): Promise<{ balance: number; hold: number }> {
  const [row] = await db
    .select({ balance: userBalances.balance, hold: userBalances.balance_hold })
    .from(userBalances)
    .where(eq(userBalances.user_id, userId));

  return { balance: row?.balance ?? 0, hold: row?.hold ?? 0 };
}
