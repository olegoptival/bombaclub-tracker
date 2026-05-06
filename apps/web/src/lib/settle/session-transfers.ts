import { Prisma } from "@prisma/client";
import { settle, type SettleBalance, type SettleTransfer } from "./algorithm";

/**
 * Compute settle-up transfers for ONE session — based on each participant's
 * profit/loss in that session (NOT their global club balance).
 *
 * Guests are included: a settle row "Guest X owes Y" is meaningful even
 * though guests don't have ledger entries.
 */
export type SessionParticipantPnL = {
  participant_id: string;
  display_name: string;
  is_guest: boolean;
  profit_loss: Prisma.Decimal;
};

export function computeSessionTransfers(
  participants: SessionParticipantPnL[]
): SettleTransfer[] {
  const balances: SettleBalance[] = participants
    .filter((p) => !p.profit_loss.eq(0))
    .map((p) => ({
      player_id: p.participant_id,
      name: p.display_name,
      amount: p.profit_loss,
    }));

  if (balances.length === 0) return [];

  const sum = balances.reduce(
    (acc, b) => acc.add(b.amount),
    new Prisma.Decimal(0)
  );
  // If sum is way off (>10), the session data is broken — return empty
  // rather than producing nonsense transfers.
  if (sum.abs().gt(10)) return [];

  return settle(balances);
}
