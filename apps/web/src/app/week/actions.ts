"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import {
  parseWeekParam,
  weekRangeUtc,
  currentIsoWeek,
  compareWeeks,
} from "./week-utils";
import {
  computeWeeklyTransfers,
  type MemberPnL,
} from "@/lib/settle/weekly-transfers";

export type WeekActionState = { error?: string; success?: string };

export async function closeWeekAction(
  _prev: WeekActionState,
  formData: FormData
): Promise<WeekActionState> {
  const weekParam = String(formData.get("week") ?? "");
  const week = parseWeekParam(weekParam);
  if (!week) return { error: "Invalid week" };

  const ctx = await getAppContext();
  if (!ctx.activeClub) return { error: "No active club" };
  if (ctx.activeClub.role !== "host" && !ctx.user.isSuperuser) {
    return { error: "Only host or admin can close weeks" };
  }

  // Refuse closing the current (still active) week.
  if (compareWeeks(week, currentIsoWeek()) >= 0) {
    return { error: "Cannot close the current week — wait until it ends" };
  }

  const clubId = ctx.activeClub.club_id;
  const { start, end } = weekRangeUtc(week);

  // Check no pending sessions in this week.
  const pending = await db.sessions.count({
    where: {
      club_id: clubId,
      type: "online",
      status: { notIn: ["ended", "cancelled"] },
      started_at: { gte: start, lt: end },
    },
  });
  if (pending > 0) {
    return {
      error: `Finish or cancel ${pending} pending session${pending !== 1 ? "s" : ""} before closing the week`,
    };
  }

  // Already closed?
  const existing = await db.settlement_periods.findFirst({
    where: {
      club_id: clubId,
      period_start: start,
      period_end: end,
    },
  });
  if (existing) {
    return { error: "This week is already closed" };
  }

  // Load all ended online sessions in this week with participants.
  const sessions = await db.sessions.findMany({
    where: {
      club_id: clubId,
      type: "online",
      status: "ended",
      started_at: { gte: start, lt: end },
    },
    include: {
      session_participants: {
        include: {
          club_members: { select: { id: true, nickname: true } },
        },
      },
      session_results: true,
    },
  });

  // Check for guests in any session.
  const guestCount = sessions
    .flatMap((s) => s.session_participants)
    .filter((p) => !p.club_member_id).length;
  if (guestCount > 0) {
    return {
      error: `Convert ${guestCount} guest${guestCount !== 1 ? "s" : ""} to members before closing the week`,
    };
  }

  // Aggregate PnL by club_member_id.
  const map = new Map<string, MemberPnL>();
  for (const s of sessions) {
    for (const r of s.session_results) {
      const part = s.session_participants.find((p) => p.id === r.participant_id);
      if (!part?.club_member_id || !part.club_members) continue;
      const mid = part.club_member_id;
      const cur = map.get(mid);
      if (cur) {
        cur.pnl = cur.pnl.add(r.profit_loss);
      } else {
        map.set(mid, {
          member_id: mid,
          display_name: part.club_members.nickname,
          pnl: r.profit_loss,
        });
      }
    }
  }
  const rows = Array.from(map.values());

  const transfers = computeWeeklyTransfers(rows);

  // Even if transfers are empty (e.g. everyone broke even),
  // we still create a closed period — to mark "this week was processed".
  try {
    await db.$transaction(async (tx) => {
      const period = await tx.settlement_periods.create({
        data: {
          club_id: clubId,
          period_start: start,
          period_end: end,
          status: "closed",
          closed_at: new Date(),
          closed_by: ctx.user.id,
        },
      });
      if (transfers.length > 0) {
        await tx.settlement_transfers.createMany({
          data: transfers.map((t) => ({
            period_id: period.id,
            from_member_id: t.from_player_id,
            to_member_id: t.to_player_id,
            amount: new Prisma.Decimal(t.amount.toString()),
          })),
        });
      }
    });
  } catch (e) {
    console.error("closeWeekAction failed", e);
    return { error: "Failed to close week" };
  }

  revalidatePath("/week");
  return { success: "Week closed" };
}

export async function reopenWeekAction(
  _prev: WeekActionState,
  formData: FormData
): Promise<WeekActionState> {
  const weekParam = String(formData.get("week") ?? "");
  const week = parseWeekParam(weekParam);
  if (!week) return { error: "Invalid week" };

  const ctx = await getAppContext();
  if (!ctx.activeClub) return { error: "No active club" };
  if (ctx.activeClub.role !== "host" && !ctx.user.isSuperuser) {
    return { error: "Only host or admin can reopen weeks" };
  }

  const clubId = ctx.activeClub.club_id;
  const { start, end } = weekRangeUtc(week);

  const period = await db.settlement_periods.findFirst({
    where: {
      club_id: clubId,
      period_start: start,
      period_end: end,
    },
  });
  if (!period) return { error: "Week is not closed" };

  try {
    await db.$transaction(async (tx) => {
      await tx.settlement_transfers.deleteMany({
        where: { period_id: period.id },
      });
      await tx.settlement_periods.delete({ where: { id: period.id } });
    });
  } catch (e) {
    console.error("reopenWeekAction failed", e);
    return { error: "Failed to reopen week" };
  }

  revalidatePath("/week");
  return { success: "Week reopened" };
}
