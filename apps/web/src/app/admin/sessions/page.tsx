import Link from "next/link";
import { db } from "@/lib/db";
import { CancelSessionButton } from "./cancel-button";

export const metadata = { title: "Sessions · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ show_cancelled?: string }>;
}) {
  const sp = await searchParams;
  const showCancelled = sp.show_cancelled === "1";

  const sessions = await db.sessions.findMany({
    where: showCancelled ? {} : { NOT: { status: "cancelled" } },
    orderBy: { created_at: "desc" },
    include: {
      clubs: { select: { name: true, slug: true } },
      users_sessions_host_idTousers: { select: { login: true, display_name: true } },
      _count: { select: { session_participants: true } },
    },
  });

  const cancelledCount = await db.sessions.count({ where: { status: "cancelled" } });

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Sessions
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2 }}>
            {sessions.length} shown
            {!showCancelled && cancelledCount > 0 ? ` (${cancelledCount} cancelled hidden)` : ""}.
          </p>
        </div>
        <Link
          href={showCancelled ? "/admin/sessions" : "/admin/sessions?show_cancelled=1"}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
        >
          {showCancelled ? "Hide cancelled" : "Show cancelled"}
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div
          className="pkr-card"
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--fg-2)",
            fontSize: 13,
          }}
        >
          No sessions to show.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.map((s) => {
            const host = s.users_sessions_host_idTousers;
            const label =
              s.title ??
              `${s.type === "online" ? "Online" : "Offline"} session ${new Date(
                s.created_at
              ).toLocaleDateString()}`;
            const isCancelled = s.status === "cancelled";

            return (
              <div
                key={s.id}
                className="pkr-card"
                style={{
                  padding: 0,
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "space-between",
                  gap: 0,
                  opacity: isCancelled ? 0.65 : 1,
                }}
              >
                <Link
                  href={`/admin/sessions/${s.id}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: 14,
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{label}</span>
                    <span
                      style={{
                        padding: "1px 7px",
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
                        padding: "1px 7px",
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
                      fontSize: 12,
                      color: "var(--fg-2)",
                      marginTop: 4,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>club: {s.clubs.name}</span>
                    <span>•</span>
                    <span>
                      host: {host.display_name}{" "}
                      <span data-mono style={{ opacity: 0.7 }}>
                        ({host.login})
                      </span>
                    </span>
                    <span>•</span>
                    <span>{s._count.session_participants} participants</span>
                    <span>•</span>
                    <span data-mono>
                      created {new Date(s.created_at).toLocaleString()}
                    </span>
                    {s.ended_at && (
                      <>
                        <span>•</span>
                        <span data-mono>
                          ended {new Date(s.ended_at).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
                {!isCancelled && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      paddingRight: 14,
                    }}
                  >
                    <CancelSessionButton sessionId={s.id} label={label} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
