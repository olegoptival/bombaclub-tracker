import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import {
  currentIsoWeek,
  parseWeekParam,
  weekRangeUtc,
  type IsoWeek,
} from "./week-utils";
import { WeekHeader } from "./week-header";
import { ViewToggle } from "./view-toggle";
import { MyWeek } from "./my-week";
import { AllPlayers } from "./all-players";
import { CloseSection, type TransferRow } from "./close-section";
import { computeWeeklyTransfers, type MemberPnL } from "@/lib/settle/weekly-transfers";
import { compareWeeks } from "./week-utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Week · Bombaclub Tracker" };

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; view?: string }>;
}) {
  const ctx = await getAppContext();
  if (!ctx.activeClub) redirect("/");

  const sp = await searchParams;
  const week: IsoWeek = parseWeekParam(sp.week) ?? currentIsoWeek();
  const isHostOrAdmin =
    ctx.activeClub.role === "host" || ctx.user.isSuperuser;
  const requestedView = sp.view === "all" ? "all" : "mine";
  const view: "mine" | "all" =
    requestedView === "all" && isHostOrAdmin ? "all" : "mine";

  const { start, end } = weekRangeUtc(week);
  const clubId = ctx.activeClub.club_id;

  // Resolve current user's club_member_id for "mine" view.
  const myMember = await db.club_members.findFirst({
    where: { club_id: clubId, user_id: ctx.user.id },
    select: { id: true },
  });
  const myMemberId = myMember?.id ?? null;

  // All ended online sessions in this club, started_at in this UTC week.
  const sessions = await db.sessions.findMany({
    where: {
      club_id: clubId,
      type: "online",
      status: "ended",
      started_at: { gte: start, lt: end },
    },
    include: {
      session_results: {
        include: {
          session_participants: {
            include: {
              club_members: { select: { id: true, nickname: true } },
            },
          },
        },
      },
    },
    orderBy: { started_at: "asc" },
  });

  // ─── Weekly settle-up data ──────────────────────────────────────────
  const isHostOrAdmin2 = isHostOrAdmin;
  const isPastWeek = compareWeeks(week, currentIsoWeek()) < 0;

  const closedPeriod = await db.settlement_periods.findFirst({
    where: { club_id: clubId, period_start: start, period_end: end },
    include: {
      settlement_transfers: {
        include: {
          club_members_settlement_transfers_from_member_idToclub_members: {
            select: { id: true, nickname: true },
          },
          club_members_settlement_transfers_to_member_idToclub_members: {
            select: { id: true, nickname: true },
          },
        },
      },
    },
  });

  // Build member PnL map (members only — guests excluded for settle)
  const memberPnlMap = new Map<string, MemberPnL>();
  let guestCount = 0;
  for (const s of sessions) {
    for (const r of s.session_results) {
      const sp = r.session_participants;
      if (!sp.club_member_id || !sp.club_members) {
        guestCount += 1;
        continue;
      }
      const mid = sp.club_member_id;
      const cur = memberPnlMap.get(mid);
      if (cur) {
        cur.pnl = cur.pnl.add(r.profit_loss);
      } else {
        memberPnlMap.set(mid, {
          member_id: mid,
          display_name: sp.club_members.nickname,
          pnl: r.profit_loss,
        });
      }
    }
  }

  const previewTransfers: TransferRow[] = computeWeeklyTransfers(
    Array.from(memberPnlMap.values())
  ).map((t) => ({
    from_nickname: t.from_player_name,
    to_nickname: t.to_player_name,
    amount: new Prisma.Decimal(t.amount.toString()),
  }));

  let closedView: { closedAt: Date; transfers: TransferRow[] } | null = null;
  if (closedPeriod) {
    closedView = {
      closedAt: closedPeriod.closed_at ?? closedPeriod.created_at,
      transfers: closedPeriod.settlement_transfers.map((tr) => ({
        from_nickname:
          tr.club_members_settlement_transfers_from_member_idToclub_members
            ?.nickname ?? "?",
        to_nickname:
          tr.club_members_settlement_transfers_to_member_idToclub_members
            ?.nickname ?? "?",
        amount: tr.amount,
      })),
    };
  }

  let pendingSessionsCount = 0;
  if (isPastWeek && !closedView) {
    pendingSessionsCount = await db.sessions.count({
      where: {
        club_id: clubId,
        type: "online",
        status: { notIn: ["ended", "cancelled"] },
        started_at: { gte: start, lt: end },
      },
    });
  }

  // Resolve "my" transfers (mine view, both closed and preview)
  const myTransfers: TransferRow[] = myMemberId
    ? (closedView?.transfers ?? previewTransfers).filter(
        (t) =>
          // We need member ids to filter accurately.
          true
      )
    : [];
  // For mine view filter we need member ids on transfers. Use a helper map.
  const memberById = new Map<string, string>();
  for (const m of memberPnlMap.values()) memberById.set(m.member_id, m.display_name);

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <WeekHeader week={week} view={view} />
        {isHostOrAdmin && <ViewToggle week={week} view={view} />}

        {view === "mine" ? (
          renderMine(sessions, myMemberId)
        ) : (
          <>
            {renderAll(sessions, clubId, week)}
            <CloseSection
              week={week}
              isHostOrAdmin={isHostOrAdmin2}
              isPastWeek={isPastWeek}
              closed={closedView}
              preview={previewTransfers}
              pendingSessionsCount={pendingSessionsCount}
              guestCount={guestCount}
            />
          </>
        )}
      </div>
    </main>
  );
}

type SessionRow = {
  id: string;
  started_at: Date | null;
  ended_at: Date | null;
  title: string | null;
  session_results: {
    profit_loss: Prisma.Decimal;
    session_participants: {
      club_member_id: string | null;
      club_members: { id: string; nickname: string } | null;
    };
  }[];
};

function renderMine(sessions: SessionRow[], memberId: string | null) {
  let total = new Prisma.Decimal(0);
  let count = 0;
  const rows: {
    id: string;
    started_at: Date | null;
    ended_at: Date | null;
    title: string | null;
    pnl: Prisma.Decimal;
  }[] = [];

  if (memberId) {
    for (const s of sessions) {
      const mine = s.session_results.find((r) => r.session_participants.club_member_id === memberId);
      if (!mine) continue;
      total = total.add(mine.profit_loss);
      count += 1;
      rows.push({
        id: s.id,
        started_at: s.started_at,
        ended_at: s.ended_at,
        title: s.title,
        pnl: mine.profit_loss,
      });
    }
  }

  rows.sort(
    (a, b) => (b.started_at?.getTime() ?? 0) - (a.started_at?.getTime() ?? 0)
  );

  return <MyWeek totalPnl={total} sessionsCount={count} sessions={rows} />;
}

function renderAll(sessions: SessionRow[], clubId: string, week: IsoWeek) {
  const map = new Map<string, { nickname: string; pnl: Prisma.Decimal; sessions_count: number }>();
  for (const s of sessions) {
    for (const r of s.session_results) {
      const memberId = r.session_participants.club_member_id;
      const member = r.session_participants.club_members;
      if (!memberId || !member) continue;
      const cur = map.get(memberId);
      if (cur) {
        cur.pnl = cur.pnl.add(r.profit_loss);
        cur.sessions_count += 1;
      } else {
        map.set(memberId, {
          nickname: member.nickname,
          pnl: r.profit_loss,
          sessions_count: 1,
        });
      }
    }
  }
  const rows = Array.from(map.entries())
    .map(([member_id, v]) => ({
      member_id,
      nickname: v.nickname,
      pnl: v.pnl,
      sessions_count: v.sessions_count,
    }))
    .sort((a, b) => parseFloat(b.pnl.toString()) - parseFloat(a.pnl.toString()));

  return <AllPlayers clubId={clubId} week={week} rows={rows} />;
}
