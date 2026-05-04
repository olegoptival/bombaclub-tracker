import { Prisma, type PrismaClient } from "@prisma/client";

export type LedgerReason =
  | "session_result"
  | "manual_adjustment"
  | "dispute_resolution"
  | "settlement_transfer"
  | "correction";

export type PostLedgerEntryInput = {
  club_id: string;
  member_id: string;
  delta: Prisma.Decimal | number | string;
  reason: LedgerReason;
  description?: string;
  session_id?: string;
  transfer_id?: string;
  dispute_id?: string;
  actor_user_id?: string;
};

/**
 * Append a ledger entry and update the cached current_balance atomically.
 *
 * Caller is responsible for wrapping this in db.$transaction(async (tx) => ...)
 * if the change is part of a larger atomic unit (e.g. a session creating
 * multiple ledger entries — one per participant).
 *
 * For one-off changes, you can pass the global `db` client directly; Prisma
 * will use a single connection for both calls but won't make them atomic.
 * Prefer transactions whenever there are multiple writes.
 */
export async function postLedgerEntry(
  tx: Prisma.TransactionClient | PrismaClient,
  input: PostLedgerEntryInput
) {
  const member = await tx.club_members.findUnique({
    where: { id: input.member_id },
    select: { id: true, club_id: true, current_balance: true },
  });
  if (!member) throw new Error(`club_member not found: ${input.member_id}`);
  if (member.club_id !== input.club_id) {
    throw new Error(
      `member ${input.member_id} belongs to club ${member.club_id}, not ${input.club_id}`
    );
  }

  const delta = new Prisma.Decimal(input.delta);
  const balance_after = member.current_balance.add(delta);

  const entry = await tx.ledger_entries.create({
    data: {
      club_id: input.club_id,
      member_id: input.member_id,
      delta,
      balance_after,
      reason: input.reason,
      description: input.description,
      session_id: input.session_id,
      transfer_id: input.transfer_id,
      dispute_id: input.dispute_id,
      actor_user_id: input.actor_user_id,
    },
  });

  await tx.club_members.update({
    where: { id: input.member_id },
    data: { current_balance: balance_after },
  });

  return entry;
}
