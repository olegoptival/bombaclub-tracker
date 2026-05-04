import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Session · Bombaclub Tracker" };

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAppContext();
  if (!ctx.activeClub) redirect("/");

  const session = await db.sessions.findUnique({
    where: { id },
    include: {
      session_participants: {
        include: {
          ocr_screen_results: { select: { profit_loss: true } },
          club_members: { select: { nickname: true } },
        },
      },
      ocr_imports: {
        where: { status: "parsed" },
        orderBy: { created_at: "asc" },
      },
    },
  });
  if (!session) notFound();
  if (session.club_id !== ctx.activeClub.club_id) redirect("/");

  // If draft, redirect to wizard
  if (session.status === "created") redirect(`/sessions/${id}/upload`);

  const rows = session.session_participants
    .map((p) => {
      const total = p.ocr_screen_results.reduce(
        (acc, r) => acc.add(r.profit_loss),
        new Prisma.Decimal(0)
      );
      return {
        id: p.id,
        name: p.club_members?.nickname ?? p.guest_name ?? "Unknown",
        is_guest: !p.club_member_id,
        total,
      };
    })
    .sort((a, b) => parseFloat(b.total.toString()) - parseFloat(a.total.toString()));

  const sumPnL = rows.reduce(
    (acc, r) => acc.add(r.total),
    new Prisma.Decimal(0)
  );

  // Pick the first parsed_data for table metadata
  const firstParsed = session.ocr_imports[0]?.parsed_data as
    | {
        table?: {
          name?: string;
          game_type?: string;
          blinds?: string;
          buy_in_min?: number;
          buy_in_max?: number;
        };
      }
    | undefined;

  const tableMeta = firstParsed?.table;
  const sessionDate = session.ended_at ?? session.started_at ?? session.created_at;

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link href="/" style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}>
          ← Back
        </Link>

        <div style={{ marginTop: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {session.title ?? (session.type === "online" ? "Online session" : "Offline session")}
            </h1>
            <StatusBadge status={session.status} />
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-2)", display: "flex", gap: 8 }}>
            <span>{session.type === "online" ? "Online" : "Offline"}</span>
            <span>·</span>
            <span data-mono>{new Date(sessionDate).toLocaleString()}</span>
          </div>
        </div>

        {tableMeta && (
          <div className="pkr-card" style={{ padding: 14, marginBottom: 14 }}>
            <div className="pkr-section-label" style={{ marginBottom: 8 }}>Table</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", fontSize: 13 }}>
              {tableMeta.name && <Field label="Name" value={tableMeta.name} />}
              {tableMeta.game_type && <Field label="Game" value={tableMeta.game_type} />}
              {tableMeta.blinds && <Field label="Blinds" value={tableMeta.blinds} mono />}
              {(tableMeta.buy_in_min || tableMeta.buy_in_max) && (
                <Field
                  label="Buy-in"
                  value={`${tableMeta.buy_in_min ?? "?"} – ${tableMeta.buy_in_max ?? "?"}`}
                  mono
                />
              )}
            </div>
          </div>
        )}

        <div className="pkr-card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="pkr-section-label" style={{ marginBottom: 8 }}>
            Participants · {rows.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((r, i) => {
              const num = parseFloat(r.total.toString());
              const color = num > 0 ? "var(--pos)" : num < 0 ? "var(--neg)" : "var(--fg-1)";
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
                    {r.is_guest && (
                      <span
                        style={{
                          padding: "1px 6px",
                          fontSize: 9.5,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.04,
                          background: "var(--bg-3)",
                          color: "var(--fg-2)",
                          borderRadius: 999,
                        }}
                      >
                        Guest
                      </span>
                    )}
                  </div>
                  <span data-mono style={{ fontSize: 15, fontWeight: 600, color }}>
                    {num > 0 ? "+" : num < 0 ? "−" : ""}
                    {Math.abs(num).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 8,
              paddingTop: 10,
              borderTop: "0.5px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--fg-2)",
            }}
          >
            <span>Sum</span>
            <span data-mono>{parseFloat(sumPnL.toString()).toFixed(2)}</span>
          </div>
        </div>

        {session.type === "online" && session.ocr_imports.length > 0 && (
          <div className="pkr-card" style={{ padding: 14 }}>
            <div className="pkr-section-label" style={{ marginBottom: 8 }}>
              Screenshots · {session.ocr_imports.length}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 12,
                color: "var(--fg-2)",
              }}
            >
              {session.ocr_imports.map((i) => {
                const pd = i.parsed_data as { table?: { name?: string }; players?: unknown[] } | null;
                return (
                  <div
                    key={i.id}
                    style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}
                  >
                    <span>{pd?.table?.name ?? "—"}</span>
                    <span data-mono>{Array.isArray(pd?.players) ? pd.players.length : "?"} players</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="pkr-section-label" style={{ fontSize: 10, marginBottom: 2 }}>
        {label}
      </div>
      <div data-mono={mono ? true : undefined} style={{ fontSize: 13, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    created: { bg: "var(--bg-3)", fg: "var(--fg-2)", label: "Draft" },
    in_progress: { bg: "var(--felt-soft)", fg: "var(--felt)", label: "Live" },
    ended: { bg: "var(--bg-3)", fg: "var(--fg-2)", label: "Ended" },
    disputed: { bg: "rgba(217,117,101,0.15)", fg: "var(--neg)", label: "Disputed" },
    cancelled: { bg: "var(--bg-3)", fg: "var(--fg-3)", label: "Cancelled" },
  };
  const s = map[status] ?? map.ended;
  return (
    <span
      style={{
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.04,
        background: s!.bg,
        color: s!.fg,
        borderRadius: 999,
      }}
    >
      {s!.label}
    </span>
  );
}
