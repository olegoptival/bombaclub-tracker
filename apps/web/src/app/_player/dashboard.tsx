import Link from "next/link";
import { logoutAction } from "@/lib/actions/logout";
import { db } from "@/lib/db";
import type { AppContext } from "@/lib/session/context";
import { MoneyDisplay } from "@/components/money-display";
import { ClubSwitcher } from "@/components/club-switcher";

type Period = "week" | "month" | "all";

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

const PERIOD_LABELS: Record<Period, string> = {
  week: "Week",
  month: "Month",
  all: "All time",
};

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

  // Hero balance:
  //   - all time → use the materialized current_balance on club_members
  //   - week/month → sum profit_loss across session_results within the window
  let balance: number;
  if (period === "all") {
    balance = parseFloat(club.current_balance);
  } else {
    const rows = await db.session_results.findMany({
      where: {
        session_participants: { club_member_id: club.member_id },
        sessions: {
          status: "ended",
          ended_at: { gte: cutoff! },
        },
      },
      select: { profit_loss: true },
    });
    balance = rows.reduce((acc, r) => acc + parseFloat(r.profit_loss.toString()), 0);
  }

  // Last 5 sessions, filtered by the same period as the hero balance
  const recentParticipations = await db.session_participants.findMany({
    where: {
      club_member_id: club.member_id,
      sessions: {
        status: "ended",
        ...(cutoff ? { ended_at: { gte: cutoff } } : {}),
      },
    },
    orderBy: { sessions: { ended_at: "desc" } },
    take: 5,
    include: {
      sessions: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          started_at: true,
          ended_at: true,
        },
      },
      session_results: {
        select: { profit_loss: true },
      },
    },
  });

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
        <div style={{ display: "flex", gap: 6 }}>
          {ctx.user.isSuperuser && (
            <Link href="/admin" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
              Admin
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
        {/* Period switcher */}
        <div
          role="tablist"
          aria-label="Statistics period"
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: "var(--bg-2)",
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          {(["week", "month", "all"] as Period[]).map((p) => {
            const active = p === period;
            return (
              <Link
                key={p}
                href={p === "all" ? "/" : `/?period=${p}`}
                role="tab"
                aria-selected={active}
                scroll={false}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "8px 0",
                  fontSize: 12.5,
                  fontWeight: 500,
                  borderRadius: 7,
                  textDecoration: "none",
                  color: active ? "var(--fg-1)" : "var(--fg-2)",
                  background: active ? "var(--bg-1)" : "transparent",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                  transition: "background 120ms, color 120ms",
                }}
              >
                {PERIOD_LABELS[p]}
              </Link>
            );
          })}
        </div>

        {/* Balance hero */}
        <div className="pkr-card" style={{ padding: 22, marginBottom: 14 }}>
          <div className="pkr-section-label" style={{ marginBottom: 8 }}>
            Balance · {PERIOD_LABELS[period].toLowerCase()}
          </div>
          <MoneyDisplay value={balance} size="hero" />
        </div>

        {/* Recent sessions */}
        <div style={{ marginTop: 18 }}>
          <div
            className="pkr-section-label"
            style={{ marginBottom: 10, paddingInline: 4 }}
          >
            Last sessions
          </div>
          {recentParticipations.length === 0 ? (
            <div
              className="pkr-card"
              style={{
                padding: 28,
                textAlign: "center",
                color: "var(--fg-2)",
                fontSize: 13,
              }}
            >
              No sessions in this period.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentParticipations.map((p) => {
                const s = p.sessions;
                const result = p.session_results[0];
                const net = result
                  ? parseFloat(result.profit_loss.toString())
                  : null;
                const date = s.ended_at ?? s.started_at;
                return (
                  <Link
                    key={p.id}
                    href={`/sessions/${s.id}`}
                    className="pkr-card"
                    style={{
                      padding: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {s.title ?? `${s.type === "online" ? "Online" : "Offline"} session`}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--fg-2)",
                          marginTop: 2,
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <span>{s.type === "online" ? "Online" : "Offline"}</span>
                        <span>•</span>
                        <span data-mono>
                          {date ? new Date(date).toLocaleDateString() : "—"}
                        </span>
                        {s.status !== "ended" && (
                          <>
                            <span>•</span>
                            <span style={{ color: "var(--status-warning)" }}>
                              {s.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {net !== null && <MoneyDisplay value={net} size="md" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {club.role === "host" && (
          <div
            style={{
              position: "fixed",
              bottom: 20,
              left: 16,
              right: 16,
              maxWidth: 460,
              marginInline: "auto",
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
