"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type ActionState = { error?: string };

async function requireHostOfSession(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in.");
  const dbSession = await db.sessions.findUnique({
    where: { id: sessionId },
    select: { id: true, host_id: true, co_host_id: true, club_id: true, status: true, type: true },
  });
  if (!dbSession) throw new Error("Session not found.");
  if (dbSession.type !== "offline") throw new Error("Not an offline session.");
  if (dbSession.status !== "in_progress") throw new Error("Session is not active.");
  if (dbSession.host_id !== session.user.id && dbSession.co_host_id !== session.user.id) {
    throw new Error("Forbidden.");
  }
  const table = await db.tables.findFirst({ where: { session_id: sessionId } });
  if (!table) throw new Error("Table not found.");
  return { dbSession, userId: session.user.id, table };
}

const addPlayerSchema = z.object({
  session_id: z.string().uuid(),
  kind: z.enum(["member", "guest"]),
  member_id: z.string().uuid().optional().or(z.literal("")),
  guest_name: z.string().trim().max(64).optional().or(z.literal("")),
  buy_in_amount: z.coerce.number().positive(),
});

export async function addPlayerAction(
  _p: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const parsed = addPlayerSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }
    const { session_id, kind, member_id, guest_name, buy_in_amount } = parsed.data;
    const { dbSession, userId, table } = await requireHostOfSession(session_id);

    let participantId: string;
    if (kind === "member") {
      if (!member_id) return { error: "Pick a club member." };
      // Verify member belongs to this club
      const m = await db.club_members.findUnique({ where: { id: member_id } });
      if (!m || m.club_id !== dbSession.club_id) {
        return { error: "Member not in this club." };
      }
      const existing = await db.session_participants.findUnique({
        where: { session_id_club_member_id: { session_id, club_member_id: member_id } },
        select: { id: true },
      });
      participantId = existing
        ? existing.id
        : (
            await db.session_participants.create({
              data: { session_id, club_member_id: member_id },
              select: { id: true },
            })
          ).id;
    } else {
      const name = (guest_name ?? "").trim();
      if (!name) return { error: "Guest name required." };
      const p = await db.session_participants.create({
        data: { session_id, guest_name: name },
        select: { id: true },
      });
      participantId = p.id;
    }

    const now = new Date();
    await db.$transaction([
      db.buy_in_events.create({
        data: {
          table_id: table.id,
          participant_id: participantId,
          amount: new Prisma.Decimal(buy_in_amount),
          created_by: userId,
          occurred_at: now,
        },
      }),
      db.sessions.update({
        where: { id: session_id },
        data: { last_activity_at: now },
      }),
    ]);

    revalidatePath(`/sessions/${session_id}/live`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

const rebuySchema = z.object({
  session_id: z.string().uuid(),
  participant_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
});

export async function rebuyAction(
  _p: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const parsed = rebuySchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    const { session_id, participant_id, amount } = parsed.data;
    const { userId, table } = await requireHostOfSession(session_id);

    const now = new Date();
    await db.$transaction([
      db.buy_in_events.create({
        data: {
          table_id: table.id,
          participant_id,
          amount: new Prisma.Decimal(amount),
          created_by: userId,
          occurred_at: now,
        },
      }),
      db.sessions.update({
        where: { id: session_id },
        data: { last_activity_at: now },
      }),
    ]);

    revalidatePath(`/sessions/${session_id}/live`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

const cashOutSchema = z.object({
  session_id: z.string().uuid(),
  participant_id: z.string().uuid(),
  stack_amount: z.coerce.number().nonnegative(),
});

export async function cashOutAction(
  _p: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const parsed = cashOutSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    const { session_id, participant_id, stack_amount } = parsed.data;
    const { userId, table } = await requireHostOfSession(session_id);

    // Block double cash-out
    const existing = await db.cash_out_events.findFirst({
      where: { participant_id, deleted_at: null },
    });
    if (existing) return { error: "Player has already cashed out. Undo it first to redo." };

    const now = new Date();
    await db.$transaction([
      db.cash_out_events.create({
        data: {
          table_id: table.id,
          participant_id,
          stack_amount: new Prisma.Decimal(stack_amount),
          created_by: userId,
          occurred_at: now,
        },
      }),
      db.sessions.update({
        where: { id: session_id },
        data: { last_activity_at: now },
      }),
    ]);

    revalidatePath(`/sessions/${session_id}/live`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

const undoSchema = z.object({
  session_id: z.string().uuid(),
});

export async function undoLastAction(
  _p: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const parsed = undoSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return { error: "Invalid input." };
    const { session_id } = parsed.data;
    const { userId, table } = await requireHostOfSession(session_id);

    // Find newest non-deleted event across both buy_in + cash_out for this table
    const lastBuy = await db.buy_in_events.findFirst({
      where: { table_id: table.id, deleted_at: null },
      orderBy: { occurred_at: "desc" },
    });
    const lastCash = await db.cash_out_events.findFirst({
      where: { table_id: table.id, deleted_at: null },
      orderBy: { occurred_at: "desc" },
    });

    let target: { kind: "buy" | "cash"; id: string; at: Date } | null = null;
    if (lastBuy && lastCash) {
      target =
        lastBuy.occurred_at > lastCash.occurred_at
          ? { kind: "buy", id: lastBuy.id, at: lastBuy.occurred_at }
          : { kind: "cash", id: lastCash.id, at: lastCash.occurred_at };
    } else if (lastBuy) {
      target = { kind: "buy", id: lastBuy.id, at: lastBuy.occurred_at };
    } else if (lastCash) {
      target = { kind: "cash", id: lastCash.id, at: lastCash.occurred_at };
    }
    if (!target) return { error: "Nothing to undo." };

    const now = new Date();
    if (target.kind === "buy") {
      await db.buy_in_events.update({
        where: { id: target.id },
        data: { deleted_at: now, deleted_by: userId },
      });
    } else {
      await db.cash_out_events.update({
        where: { id: target.id },
        data: { deleted_at: now, deleted_by: userId },
      });
    }

    revalidatePath(`/sessions/${session_id}/live`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function endSessionAction(
  _p: ActionState,
  fd: FormData
): Promise<ActionState> {
  try {
    const session_id = String(fd.get("session_id") ?? "");
    const { dbSession, userId, table } = await requireHostOfSession(session_id);

    // Fetch participants with active buy-ins and cash-outs
    const participants = await db.session_participants.findMany({
      where: { session_id },
      include: {
        buy_in_events: { where: { deleted_at: null } },
        cash_out_events: { where: { deleted_at: null } },
        club_members: { select: { nickname: true } },
      },
    });

    // Gate: every participant with at least one buy-in must have a cash-out
    const missing = participants.filter(
      (p) => p.buy_in_events.length > 0 && p.cash_out_events.length === 0
    );
    if (missing.length > 0) {
      const names = missing
        .map((p) => p.club_members?.nickname ?? p.guest_name ?? "Unknown")
        .join(", ");
      return { error: `Cash-out missing for: ${names}.` };
    }

    // Compute totals
    type Agg = {
      participantId: string;
      memberId: string | null;
      totalBuyIn: Prisma.Decimal;
      totalCashOut: Prisma.Decimal;
      pnl: Prisma.Decimal;
    };
    const aggs: Agg[] = participants
      .filter((p) => p.buy_in_events.length > 0)
      .map((p) => {
        const totalBuyIn = p.buy_in_events.reduce(
          (s, e) => s.add(e.amount),
          new Prisma.Decimal(0)
        );
        const totalCashOut = p.cash_out_events.reduce(
          (s, e) => s.add(e.stack_amount),
          new Prisma.Decimal(0)
        );
        return {
          participantId: p.id,
          memberId: p.club_member_id,
          totalBuyIn,
          totalCashOut,
          pnl: totalCashOut.sub(totalBuyIn),
        };
      });

    if (aggs.length === 0) {
      return { error: "No buy-ins recorded — cannot end an empty session." };
    }

    const totalBuyInSum = aggs.reduce((s, a) => s.add(a.totalBuyIn), new Prisma.Decimal(0));
    const totalCashOutSum = aggs.reduce((s, a) => s.add(a.totalCashOut), new Prisma.Decimal(0));
    const sumDiff = totalCashOutSum.sub(totalBuyInSum);
    if (sumDiff.abs().gt(10)) {
      return {
        error: `Buy-ins (${totalBuyInSum.toFixed(2)}) and cash-outs (${totalCashOutSum.toFixed(2)}) differ by ${sumDiff.toFixed(2)}. Re-check before ending.`,
      };
    }

    const now = new Date();
    await db.$transaction(async (tx) => {
      for (const a of aggs) {
        await tx.session_results.upsert({
          where: {
            session_id_participant_id: {
              session_id,
              participant_id: a.participantId,
            },
          },
          create: {
            session_id,
            participant_id: a.participantId,
            total_buy_in: a.totalBuyIn,
            total_cash_out: a.totalCashOut,
            profit_loss: a.pnl,
          },
          update: {
            total_buy_in: a.totalBuyIn,
            total_cash_out: a.totalCashOut,
            profit_loss: a.pnl,
          },
        });

        if (a.memberId) {
          const member = await tx.club_members.findUnique({
            where: { id: a.memberId },
            select: { current_balance: true },
          });
          if (!member) continue;
          const balanceAfter = member.current_balance.add(a.pnl);
          await tx.ledger_entries.create({
            data: {
              club_id: dbSession.club_id,
              member_id: a.memberId,
              delta: a.pnl,
              balance_after: balanceAfter,
              reason: "session_result",
              session_id,
              actor_user_id: userId,
            },
          });
          await tx.club_members.update({
            where: { id: a.memberId },
            data: { current_balance: balanceAfter },
          });
        }
      }

      await tx.sessions.update({
        where: { id: session_id },
        data: { status: "ended", ended_at: now },
      });
    });

    revalidatePath("/");
    revalidatePath(`/sessions/${session_id}`);
    redirect(`/sessions/${session_id}`);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
