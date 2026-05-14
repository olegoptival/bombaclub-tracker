import { Prisma } from "@prisma/client";
import { settle, type SettleBalance, type SettleTransfer } from "./algorithm";

export type MemberPnL = {
  member_id: string;
  display_name: string;
  pnl: Prisma.Decimal;
};

/**
 * Compute settle-up transfers for ONE week — based on each member's
 * aggregated profit/loss across all ended online sessions in that week.
 *
 * Guests must be excluded BEFORE calling this — guests have no
 * club_member_id and cannot be referenced in settlement_transfers.
 */
export function computeWeeklyTransfers(rows: MemberPnL[]): SettleTransfer[] {
  const balances: SettleBalance[] = rows
    .filter((r) => !r.pnl.eq(0))
    .map((r) => ({
      player_id: r.member_id,
      name: r.display_name,
      amount: r.pnl,
    }));

  if (balances.length === 0) return [];

  const sum = balances.reduce(
    (acc, b) => acc.add(b.amount),
    new Prisma.Decimal(0)
  );
  // If sum is way off (>10), session data is broken — refuse.
  if (sum.abs().gt(10)) return [];

  return settle(balances);
}
