"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type CancelSessionState = { error?: string; success?: string };

export async function cancelSessionAction(
  _prev: CancelSessionState,
  formData: FormData
): Promise<CancelSessionState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };

  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) return { error: "Missing session_id." };

  try {
    await db.$transaction(async (tx) => {
      // Lock the session row to prevent concurrent cancels
      const target = await tx.sessions.findUnique({
        where: { id: sessionId },
        select: { id: true, status: true, club_id: true },
      });
      if (!target) throw new Error("Session not found.");
      if (target.status === "cancelled") throw new Error("Session is already cancelled.");

      // Original ledger entries to be reversed
      const originals = await tx.ledger_entries.findMany({
        where: { session_id: sessionId },
        select: { member_id: true, delta: true },
      });

      // Insert compensating (negated) entries. ledger is append-only — this is the
      // only legal way to undo a session's financial effect.
      for (const e of originals) {
        // Current balance for this member (last balance_after, or sum)
        const last = await tx.ledger_entries.findFirst({
          where: { member_id: e.member_id },
          orderBy: { created_at: "desc" },
          select: { balance_after: true },
        });
        const prev = last ? Number(last.balance_after) : 0;
        const reverseDelta = -Number(e.delta);
        const newBalance = prev + reverseDelta;

        await tx.ledger_entries.create({
          data: {
            club_id: target.club_id,
            member_id: e.member_id,
            delta: reverseDelta,
            balance_after: newBalance,
            reason: "correction",
            description: `Reversal of cancelled session ${sessionId}`,
            session_id: sessionId,
            actor_user_id: session.user.id,
          },
        });
      }

      // Recompute materialized current_balance for every affected member
      const affected = Array.from(new Set(originals.map((o) => o.member_id)));
      for (const memberId of affected) {
        const agg = await tx.ledger_entries.aggregate({
          where: { member_id: memberId },
          _sum: { delta: true },
        });
        await tx.club_members.update({
          where: { id: memberId },
          data: { current_balance: agg._sum.delta ?? 0 },
        });
      }

      // Mark session as cancelled
      await tx.sessions.update({
        where: { id: sessionId },
        data: {
          status: "cancelled",
          cancelled_at: new Date(),
          cancelled_by: session.user.id,
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Cancel failed." };
  }

  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath("/");
  return { success: "Session cancelled." };
}
