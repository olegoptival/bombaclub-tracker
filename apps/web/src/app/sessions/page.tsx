import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import { MoneyDisplay } from "@/components/money-display";
import { Icon } from "@/components/ui/icon";
import { SessionTypeIcon } from "@/components/ui/session-type-icon";

export const metadata = { title: "Sessions" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function SessionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.activeClub) redirect("/");

  const sp = await searchParams;
  const pageRaw = parseInt(String(sp.page ?? "1"), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const skip = (page - 1) * PAGE_SIZE;

  const memberId = ctx.activeClub.member_id;

  const [total, participations] = await Promise.all([
    db.session_participants.count({
      where: {
        club_member_id: memberId,
        sessions: { status: "ended" },
      },
    }),
    db.session_participants.findMany({
      where: {
        club_member_id: memberId,
        sessions: { status: "ended" },
      },
      orderBy: { sessions: { ended_at: "desc" } },
      skip,
      take: PAGE_SIZE,
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
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <div style={{ marginBottom: 14 }}>
          <Link
            href="/"
            style={{
              fontSize: 12,
              color: "var(--fg-2)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="chevL" size={12} /> Back
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
          All sessions
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2, marginBottom: 16 }}>
          {total} {total === 1 ? "session" : "sessions"} total
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
        </p>

        {participations.length === 0 ? (
          <div
            className="pkr-card"
            style={{
              padding: 28,
              textAlign: "center",
              color: "var(--fg-2)",
              fontSize: 13,
            }}
          >
            No sessions yet.
          </div>
        ) : (
          <div className="pkr-card" style={{ overflow: "hidden", padding: 0 }}>
            {participations.map((p, i) => {
              const s = p.sessions;
              const result = p.session_results[0];
              const net = result ? Number(result.profit_loss) : null;
              const date = s.ended_at ?? s.started_at;
              const title =
                s.title ??
                (s.type === "online" ? "Online session" : "Live session");
              return (
                <Link
                  key={p.id}
                  href={`/sessions/${s.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <SessionTypeIcon type={s.type} size={14} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--fg-1)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--fg-2)",
                        marginTop: 1,
                      }}
                    >
                      <span data-mono>
                        {date ? new Date(date).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                  {net !== null && <MoneyDisplay value={net} size="md" />}
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            {hasPrev ? (
              <Link
                href={page - 1 === 1 ? "/sessions" : `/sessions?page=${page - 1}`}
                className="pkr-btn pkr-btn--ghost pkr-btn--sm"
              >
                <Icon name="chevL" size={12} /> Prev
              </Link>
            ) : (
              <span />
            )}
            <span style={{ fontSize: 12, color: "var(--fg-2)" }} data-mono>
              {page} / {totalPages}
            </span>
            {hasNext ? (
              <Link
                href={`/sessions?page=${page + 1}`}
                className="pkr-btn pkr-btn--ghost pkr-btn--sm"
              >
                Next <Icon name="chevR" size={12} />
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
