"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { settle, type SettleBalance } from "@/lib/settle/algorithm";

export type CloseSettleState = { error?: string; success?: string };

/**
 * Close a settle-up: record settlement_period, transfers, and ledger entries
 * that zero out balances. Sum of |balances| must be 0 (it always is for a
 * closed-system game), otherwise the operation is refused.
 *
 * Date range: just metadata for now — we settle ALL current balances.
 * Future enhancement: filter ledger by date range to settle only a slice.
 */
export async function closeSettleUpAction(
  _prev: CloseSettleState,
  formData: FormData
): Promise<CloseSettleState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  const periodStart = String(formData.get("period_start") ?? "");
  const periodEnd = String(formData.get("period_end") ?? "");
  const clubId = String(formData.get("club_id") ?? "");

  if (!periodStart || !periodEnd || !clubId) {
    return { error: "Missing fields." };
  }

  // Verify caller is a host in this club
  const callerMembership = await db.club_members.findFirst({
    where: { club_id: clubId, user_id: session.user.id, status: "active", role: "host" },
  });
  if (!callerMembership) return { error: "Only club hosts can close settle-up." };

  const members = await db.club_members.findMany({
    where: { club_id: clubId, status: "active" },
    select: { id: true, nickname: true, current_balance: true },
  });

  const balances: SettleBalance[] = members
    .filter((m) => !m.current_balance.eq(0))
    .map((m) => ({
      player_id: m.id,
      name: m.nickname,
      amount: m.current_balance,
    }));

  if (balances.length === 0) {
    return { error: "All balances are already zero — nothing to settle." };
  }

  const sum = balances.reduce(
    (acc, b) => acc.add(b.amount),
    new Prisma.Decimal(0)
  );
  if (sum.abs().gt("0.01")) {
    return {
      error: `Balances do not sum to zero (off by ${sum.toFixed(2)}). Cannot settle until they balance.`,
    };
  }

  const transfers = settle(balances);

  await db.$transaction(async (tx) => {
    const period = await tx.settlement_periods.create({
      data: {
        club_id: clubId,
        period_start: new Date(periodStart),
        period_end: new Date(periodEnd),
        status: "closed",
        closed_at: new Date(),
        closed_by: session.user.id,
      },
    });

    for (const t of transfers) {
      const transfer = await tx.settlement_transfers.create({
        data: {
          period_id: period.id,
          from_member_id: t.from_player_id,
          to_member_id: t.to_player_id,
          amount: t.amount,
        },
      });

      // Ledger: from-player gets +amount (his negative balance becomes less negative)
      const from = await tx.club_members.findUnique({
        where: { id: t.from_player_id },
        select: { current_balance: true },
      });
      if (!from) throw new Error(`from-member missing: ${t.from_player_id}`);
      const fromAfter = from.current_balance.add(t.amount);
      await tx.ledger_entries.create({
        data: {
          club_id: clubId,
          member_id: t.from_player_id,
          delta: t.amount,
          balance_after: fromAfter,
          reason: "settlement_transfer",
          transfer_id: transfer.id,
          actor_user_id: session.user.id,
          description: `Paid ${t.amount.toFixed(2)} to ${t.to_player_name}`,
        },
      });
      await tx.club_members.update({
        where: { id: t.from_player_id },
        data: { current_balance: fromAfter },
      });

      // To-player gets -amount (his positive balance shrinks)
      const to = await tx.club_members.findUnique({
        where: { id: t.to_player_id },
        select: { current_balance: true },
      });
      if (!to) throw new Error(`to-member missing: ${t.to_player_id}`);
      const toAfter = to.current_balance.sub(t.amount);
      await tx.ledger_entries.create({
        data: {
          club_id: clubId,
          member_id: t.to_player_id,
          delta: t.amount.neg(),
          balance_after: toAfter,
          reason: "settlement_transfer",
          transfer_id: transfer.id,
          actor_user_id: session.user.id,
          description: `Received ${t.amount.toFixed(2)} from ${t.from_player_name}`,
        },
      });
      await tx.club_members.update({
        where: { id: t.to_player_id },
        data: { current_balance: toAfter },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/settle-up");
  return { success: `Closed: ${transfers.length} transfer(s).` };
}
