import Link from "next/link";
import { logoutAction } from "@/lib/actions/logout";
import { db } from "@/lib/db";
import type { AppContext } from "@/lib/session/context";
import { ClubSwitcher } from "@/components/club-switcher";
import type { AreaChartPoint } from "@/components/ui/area-chart";
import type { Period } from "@/components/ui/period-picker";
import { BalanceCard, type LastSessionInfo } from "./balance-card";
import { RecentSessions, type RecentSession } from "./recent-sessions";
import { Prisma } from "@prisma/client";
import { WeekCard } from "./week-card";
import { currentIsoWeek, weekRangeUtc } from "@/app/week/week-utils";

function resolvePeriod(value: string | string[] | undefined): Period {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "week" || v === "month" ? v : "all";
}

function cutoffFor(period: Period): Date | null {
  if (period === "all") return null;
  const days = period === "week" ? 7 : 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function chartTickLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function tooltipDateLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sessionTitle(s: { title: string | null; type: string }): string {
  if (s.title) return s.title;
  return s.type === "online" ? "Online session" : "Live session";
}

export async function PlayerDashboard({
  ctx,
  searchParams,
}: {
  ctx: AppContext;
  searchParams?: { period?: string | string[] };
}) {
  const club = ctx.activeClub!;
  const period = resolvePeriod(searchParams?.period);
  const cutoff = cutoffFor(period);

  // All sessions in period (asc) — feeds the chart, the counter and the balance.
  const participationsAsc = await db.session_participants.findMany({
    where: {
      club_member_id: club.member_id,
      sessions: {
        status: "ended",
        ...(cutoff ? { ended_at: { gte: cutoff } } : {}),
      },
    },
    orderBy: { sessions: { ended_at: "asc" } },
    include: {
      sessions: {
        select: {
          id: true,
          title: true,
          type: true,
          started_at: true,
          ended_at: true,
        },
      },
      session_results: { select: { profit_loss: true } },
    },
  });

  const sessionsCount = participationsAsc.length;
  const periodPnl = participationsAsc.reduce((acc, p) => {
    const r = p.session_results[0];
    return acc + (r ? Number(r.profit_loss) : 0);
  }, 0);
  const balance = period === "all" ? Number(club.current_balance) : periodPnl;

  // Chart series — cumulative PnL with rich metadata for tooltips.
  const chartData: AreaChartPoint[] = [];
  let cum = 0;
  for (const p of participationsAsc) {
    const r = p.session_results[0];
    const pnl = r ? Number(r.profit_loss) : 0;
    cum += pnl;
    const d = new Date(p.sessions.ended_at ?? p.sessions.started_at ?? Date.now());
    chartData.push({
      x: chartTickLabel(d),
      value: cum,
      meta: { dateLabel: tooltipDateLabel(d), pnl },
    });
  }

  // Last session in period — feeds the callout.
  const last = participationsAsc[participationsAsc.length - 1];
  const lastSession: LastSessionInfo | null = last
    ? {
        type: last.sessions.type,
        title: sessionTitle(last.sessions),
        date: last.sessions.ended_at ? new Date(last.sessions.ended_at) : null,
        pnl: last.session_results[0]
          ? Number(last.session_results[0].profit_loss)
          : null,
      }
    : null;

  // Recent 3 — newest first, same period filter.
  const recent: RecentSession[] = [...participationsAsc]
    .reverse()
    .slice(0, 3)
    .map((p) => ({
      id: p.sessions.id,
      participantId: p.id,
      title: sessionTitle(p.sessions),
      type: p.sessions.type,
      date: p.sessions.ended_at
        ? new Date(p.sessions.ended_at)
        : p.sessions.started_at
          ? new Date(p.sessions.started_at)
          : null,
      net: p.session_results[0] ? Number(p.session_results[0].profit_loss) : null,
    }));

  // ─── This week (online only) ────────────────────────────────────────
  const { start: weekStart, end: weekEnd } = weekRangeUtc(currentIsoWeek());
  const weekParticipations = await db.session_participants.findMany({
    where: {
      club_member_id: club.member_id,
      sessions: {
        type: "online",
        status: "ended",
        started_at: { gte: weekStart, lt: weekEnd },
      },
    },
    include: { session_results: { select: { profit_loss: true } } },
  });
  let weekPnl = new Prisma.Decimal(0);
  let weekCount = 0;
  for (const wp of weekParticipations) {
    const r = wp.session_results[0];
    if (!r) continue;
    weekPnl = weekPnl.add(r.profit_loss);
    weekCount += 1;
  }

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 80px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 460,
          marginInline: "auto",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--fg-2)" }}>
            <ClubSwitcher
              clubs={ctx.clubs.map((c) => ({
                club_id: c.club_id,
                club_name: c.club_name,
                role: c.role,
              }))}
              activeClubId={club.club_id}
            />
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
            {ctx.user.display_name}
            {club.role === "host" && (
              <span
                style={{
                  marginLeft: 6,
                  padding: "1px 6px",
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                  background: "var(--felt-soft)",
                  color: "var(--felt)",
                  borderRadius: 999,
                }}
              >
                Host
              </span>
            )}
          </div>
        </div>
        <div className="pkr-desktop-hide" style={{ display: "flex", gap: 6 }}>
          {ctx.user.isSuperuser && (
            <Link href="/admin" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
              Admin
            </Link>
          )}
          {(club.role === "host" || ctx.user.isSuperuser) && (
            <Link href="/club/settings" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
              Club
            </Link>
          )}
          <Link href="/profile" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
            Profile
          </Link>
          <form action={logoutAction}>
            <button className="pkr-btn pkr-btn--ghost pkr-btn--sm" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <BalanceCard
          balance={balance}
          period={period}
          sessionsCount={sessionsCount}
          chartData={chartData}
          lastSession={lastSession}
        />

        <WeekCard totalPnl={weekPnl} sessionsCount={weekCount} />

        <RecentSessions items={recent} />

        {club.role === "host" && (
          <div
            className="pkr-desktop-hide"
            style={{
              position: "fixed",
              bottom: 76,
              left: 16,
              right: 16,
              maxWidth: 460,
              marginInline: "auto",
              zIndex: 40,
            }}
          >
            <Link
              href="/sessions/new"
              className="pkr-btn pkr-btn--primary pkr-btn--block"
              style={{ height: 52, fontSize: 15.5, boxShadow: "var(--shadow-lg)" }}
            >
              + New session
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
