import { ImageResponse } from "next/og";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { computeSessionTransfers } from "@/lib/settle/session-transfers";

// Force Node runtime (Edge can't reach Prisma in our setup)
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await db.sessions.findUnique({
    where: { id },
    include: {
      tables: true,
      session_participants: {
        include: {
          club_members: { select: { nickname: true } },
          session_results: true,
          ocr_screen_results: { select: { profit_loss: true } },
        },
      },
      clubs: { select: { name: true } },
    },
  });

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  // Build the same rows the page builds
  type Row = {
    id: string;
    name: string;
    is_guest: boolean;
    pnl: Prisma.Decimal;
  };
  const rows: Row[] = session.session_participants.map((p) => {
    const res = p.session_results[0];
    const pnl = res
      ? res.profit_loss
      : p.ocr_screen_results.reduce(
          (acc, r) => acc.add(r.profit_loss),
          new Prisma.Decimal(0)
        );
    return {
      id: p.id,
      name: p.club_members?.nickname ?? p.guest_name ?? "Unknown",
      is_guest: !p.club_member_id,
      pnl,
    };
  });

  const transfers = computeSessionTransfers(
    rows.map((r) => ({
      participant_id: r.id,
      display_name: r.name,
      is_guest: r.is_guest,
      profit_loss: r.pnl,
    }))
  );

  const dateStr = (session.ended_at ?? session.started_at ?? session.created_at)
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const titleLine =
    session.title ??
    (session.type === "online"
      ? "Online session"
      : session.tables[0]
      ? `${session.tables[0].game_type ?? "NLH"}${
          session.tables[0].blinds ? ` ${session.tables[0].blinds}` : ""
        }`
      : "Offline session");

  const sumPnL = rows
    .reduce((acc, r) => acc.add(r.pnl), new Prisma.Decimal(0))
    .toFixed(2);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0d0c0a",
          color: "#f4eedf",
          padding: "48px 56px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#d4a437",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {session.clubs.name}
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 600, marginTop: 6 }}>
            {titleLine}
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#9b948a", marginTop: 4 }}>
            {dateStr} · Settle-up
          </div>
        </div>

        {/* Transfers */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
          {transfers.length === 0 ? (
            <div style={{ fontSize: 24, color: "#9b948a" }}>
              All squared up — nobody owes anyone.
            </div>
          ) : (
            transfers.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 22px",
                  background: "#16140f",
                  borderRadius: 12,
                  fontSize: 28,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#9b948a" }}>{t.from_player_name}</span>
                  <span style={{ color: "#5b554b" }}>→</span>
                  <span style={{ fontWeight: 600 }}>{t.to_player_name}</span>
                </div>
                <span style={{ color: "#d4a437", fontWeight: 600 }}>
                  {parseFloat(t.amount.toString()).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid #2a2820",
            fontSize: 16,
            color: "#9b948a",
          }}
        >
          <span style={{ display: "flex" }}>
            {rows.length} player{rows.length !== 1 ? "s" : ""} · sum {sumPnL}
          </span>
          <span style={{ display: "flex" }}>bombaclub.live</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
