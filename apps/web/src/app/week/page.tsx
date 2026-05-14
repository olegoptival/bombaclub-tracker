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

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <WeekHeader week={week} view={view} />
        {isHostOrAdmin && <ViewToggle week={week} view={view} />}

        {view === "mine" ? renderMine(sessions, myMemberId) : renderAll(sessions, clubId, week)}
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
