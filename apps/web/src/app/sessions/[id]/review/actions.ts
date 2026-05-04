"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type FinalizeState = { error?: string };

export async function finalizeSessionAction(
  _prev: FinalizeState,
  formData: FormData
): Promise<FinalizeState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  const dbSession = await db.sessions.findUnique({
    where: { id: sessionId },
    select: { id: true, host_id: true, club_id: true, status: true, type: true },
  });
  if (!dbSession) return { error: "Session not found." };
  if (dbSession.host_id !== session.user.id) return { error: "Forbidden." };
  if (dbSession.status !== "created") return { error: "Session already finalized." };

  // Aggregate per-participant P&L from ocr_screen_results
  const participants = await db.session_participants.findMany({
    where: { session_id: sessionId },
    include: {
      ocr_screen_results: { select: { profit_loss: true, fee: true } },
    },
  });

  if (participants.length === 0) {
    return { error: "No participants to record." };
  }

  // Compute totals
  type Aggregate = {
    participant_id: string;
    club_member_id: string | null;
    total_pnl: Prisma.Decimal;
    total_fee: Prisma.Decimal;
  };
  const aggregates: Aggregate[] = participants.map((p) => ({
    participant_id: p.id,
    club_member_id: p.club_member_id,
    total_pnl: p.ocr_screen_results.reduce(
      (acc, r) => acc.add(r.profit_loss),
      new Prisma.Decimal(0)
    ),
    total_fee: p.ocr_screen_results.reduce(
      (acc, r) => acc.add(r.fee),
      new Prisma.Decimal(0)
    ),
  }));

  const totalSum = aggregates.reduce(
    (acc, a) => acc.add(a.total_pnl),
    new Prisma.Decimal(0)
  );

  // Hybrid threshold check (per project brief): block if |sum| > 10
  const absSum = totalSum.abs();
  if (absSum.gt(10)) {
    return {
      error: `Sum of P&L is off by ${totalSum.toFixed(2)} — too large to save. Re-check screenshots.`,
    };
  }

  // Transaction: write session_results, ledger_entries, update balances, end session
  await db.$transaction(async (tx) => {
    const now = new Date();

    for (const a of aggregates) {
      // session_results — for every participant (member or guest)
      await tx.session_results.upsert({
        where: {
          session_id_participant_id: {
            session_id: sessionId,
            participant_id: a.participant_id,
          },
        },
        create: {
          session_id: sessionId,
          participant_id: a.participant_id,
          total_buy_in: new Prisma.Decimal(0),
          total_cash_out: new Prisma.Decimal(0),
          profit_loss: a.total_pnl,
        },
        update: { profit_loss: a.total_pnl },
      });

      // ledger_entries + balance update — only for matched club members.
      // Guests don't have a club_members row, so they don't enter ledger.
      if (a.club_member_id) {
        const member = await tx.club_members.findUnique({
          where: { id: a.club_member_id },
          select: { current_balance: true },
        });
        if (!member) continue;
        const balanceAfter = member.current_balance.add(a.total_pnl);
        await tx.ledger_entries.create({
          data: {
            club_id: dbSession.club_id,
            member_id: a.club_member_id,
            delta: a.total_pnl,
            balance_after: balanceAfter,
            reason: "session_result",
            session_id: sessionId,
            actor_user_id: session.user.id,
          },
        });
        await tx.club_members.update({
          where: { id: a.club_member_id },
          data: { current_balance: balanceAfter },
        });
      }
    }

    await tx.sessions.update({
      where: { id: sessionId },
      data: { status: "ended", ended_at: now, started_at: now },
    });
  });

  revalidatePath("/");
  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}`);
}
