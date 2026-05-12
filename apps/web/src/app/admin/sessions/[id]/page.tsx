import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MoneyDisplay } from "@/components/money-display";

export const metadata = { title: "Session · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const s = await db.sessions.findUnique({
    where: { id },
    include: {
      clubs: { select: { name: true, slug: true } },
      users_sessions_host_idTousers: { select: { login: true, display_name: true } },
      users_sessions_cancelled_byTousers: { select: { login: true, display_name: true } },
      session_participants: {
        include: {
          club_members: {
            select: {
              id: true,
              nickname: true,
              users_club_members_user_idTousers: { select: { display_name: true, login: true } },
            },
          },
          session_results: {
            select: { total_buy_in: true, total_cash_out: true, profit_loss: true },
          },
        },
      },
    },
  });

  if (!s) notFound();

  const isCancelled = s.status === "cancelled";
  const label =
    s.title ??
    `${s.type === "online" ? "Online" : "Offline"} session ${new Date(
      s.created_at
    ).toLocaleDateString()}`;

  // Sort participants: by profit_loss desc, guests last
  const participants = [...s.session_participants].sort((a, b) => {
    const ap = a.session_results[0] ? Number(a.session_results[0].profit_loss) : -Infinity;
    const bp = b.session_results[0] ? Number(b.session_results[0].profit_loss) : -Infinity;
    return bp - ap;
  });

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Link
          href="/admin/sessions"
          style={{ fontSize: 12, color: "var(--fg-2)", textDecoration: "none" }}
        >
          ← All sessions
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 6,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {label}
        </h1>
        <span
          style={{
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.04,
            background: isCancelled ? "var(--status-danger-soft, #4a1d1f)" : "var(--bg-2)",
            color: isCancelled ? "var(--status-danger, #e5484d)" : "var(--fg-2)",
            borderRadius: 999,
          }}
        >
          {s.status}
        </span>
        <span
          style={{
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.04,
            background: "var(--bg-2)",
            color: "var(--fg-2)",
            borderRadius: 999,
          }}
        >
          {s.type}
        </span>
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: "var(--fg-2)",
          marginBottom: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>club: {s.clubs.name}</span>
        <span>•</span>
        <span>
          host: {s.users_sessions_host_idTousers.display_name}{" "}
          <span data-mono style={{ opacity: 0.7 }}>
            ({s.users_sessions_host_idTousers.login})
          </span>
        </span>
        <span>•</span>
        <span data-mono>created {new Date(s.created_at).toLocaleString()}</span>
        {s.started_at && (
          <>
            <span>•</span>
            <span data-mono>started {new Date(s.started_at).toLocaleString()}</span>
          </>
        )}
        {s.ended_at && (
          <>
            <span>•</span>
            <span data-mono>ended {new Date(s.ended_at).toLocaleString()}</span>
          </>
        )}
      </div>

      {isCancelled && (
        <div
          className="pkr-card"
          style={{
            padding: 14,
            marginBottom: 18,
            background: "var(--status-danger-soft, #2a1416)",
            border: "0.5px solid var(--status-danger, #e5484d)",
            fontSize: 13,
            color: "var(--fg-1)",
          }}
        >
          This session was cancelled
          {s.cancelled_at && (
            <>
              {" on "}
              <span data-mono>{new Date(s.cancelled_at).toLocaleString()}</span>
            </>
          )}
          {s.users_sessions_cancelled_byTousers && (
            <>
              {" by "}
              <strong>{s.users_sessions_cancelled_byTousers.display_name}</strong>
            </>
          )}
          . Compensating ledger entries were recorded and balances were recalculated.
          The numbers below are the session's <em>original</em> results.
        </div>
      )}

      <h2
        className="pkr-section-label"
        style={{ marginBottom: 10 }}
      >
        Participants ({participants.length})
      </h2>

      {participants.length === 0 ? (
        <div
          className="pkr-card"
          style={{
            padding: 24,
            textAlign: "center",
            color: "var(--fg-2)",
            fontSize: 13,
          }}
        >
          No participants.
        </div>
      ) : (
        <div className="pkr-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 500 }}>
                  Player
                </th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontWeight: 500 }}>
                  Buy-in
                </th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontWeight: 500 }}>
                  Cash-out
                </th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontWeight: 500 }}>
                  Net
                </th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, idx) => {
                const member = p.club_members;
                const result = p.session_results[0];
                const isGuest = !member;
                const displayName = isGuest
                  ? p.guest_name ?? "Guest"
                  : member.users_club_members_user_idTousers.display_name;
                const nick = isGuest ? null : member.nickname;

                const buyIn = result ? Number(result.total_buy_in) : 0;
                const cashOut = result ? Number(result.total_cash_out) : 0;
                const pnl = result ? Number(result.profit_loss) : null;

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderTop: idx === 0 ? "none" : "0.5px solid var(--line)",
                    }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 500 }}>
                        {displayName}
                        {isGuest && (
                          <span
                            style={{
                              marginLeft: 6,
                              padding: "1px 6px",
                              fontSize: 9.5,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.04,
                              background: "var(--bg-2)",
                              color: "var(--fg-2)",
                              borderRadius: 999,
                            }}
                          >
                            Guest
                          </span>
                        )}
                      </div>
                      {nick && (
                        <div
                          data-mono
                          style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }}
                        >
                          {nick}
                        </div>
                      )}
                    </td>
                    <td
                      data-mono
                      style={{ padding: "12px 14px", textAlign: "right", color: "var(--fg-2)" }}
                    >
                      {buyIn.toFixed(2)}
                    </td>
                    <td
                      data-mono
                      style={{ padding: "12px 14px", textAlign: "right", color: "var(--fg-2)" }}
                    >
                      {cashOut.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      {pnl !== null ? <MoneyDisplay value={pnl} size="md" /> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
