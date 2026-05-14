import { ImageResponse } from "next/og";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseWeekParam, weekRangeUtc, formatWeekLabel } from "@/app/week/week-utils";
import { computeWeeklyTransfers, type MemberPnL } from "@/lib/settle/weekly-transfers";

export const runtime = "nodejs";

type TransferRow = {
  from_nickname: string;
  to_nickname: string;
  amount: Prisma.Decimal;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string; week: string }> }
) {
  const { clubId, week: weekParam } = await params;

  const week = parseWeekParam(weekParam);
  if (!week) return new Response("Bad week", { status: 400 });

  const club = await db.clubs.findUnique({
    where: { id: clubId },
    select: { name: true },
  });
  if (!club) return new Response("Club not found", { status: 404 });

  const { start, end } = weekRangeUtc(week);

  // Try closed period first
  const closed = await db.settlement_periods.findFirst({
    where: { club_id: clubId, period_start: start, period_end: end },
    include: {
      settlement_transfers: {
        include: {
          club_members_settlement_transfers_from_member_idToclub_members: {
            select: { nickname: true },
          },
          club_members_settlement_transfers_to_member_idToclub_members: {
            select: { nickname: true },
          },
        },
      },
    },
  });

  let transfers: TransferRow[] = [];
  let status: "closed" | "preview" = "preview";

  if (closed) {
    status = "closed";
    transfers = closed.settlement_transfers.map((tr) => ({
      from_nickname:
        tr.club_members_settlement_transfers_from_member_idToclub_members
          ?.nickname ?? "?",
      to_nickname:
        tr.club_members_settlement_transfers_to_member_idToclub_members
          ?.nickname ?? "?",
      amount: tr.amount,
    }));
  } else {
    // Compute preview
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
              include: { club_members: { select: { id: true, nickname: true } } },
            },
          },
        },
      },
    });

    const map = new Map<string, MemberPnL>();
    for (const s of sessions) {
      for (const r of s.session_results) {
        const sp = r.session_participants;
        if (!sp.club_member_id || !sp.club_members) continue;
        const cur = map.get(sp.club_member_id);
        if (cur) {
          cur.pnl = cur.pnl.add(r.profit_loss);
        } else {
          map.set(sp.club_member_id, {
            member_id: sp.club_member_id,
            display_name: sp.club_members.nickname,
            pnl: r.profit_loss,
          });
        }
      }
    }
    transfers = computeWeeklyTransfers(Array.from(map.values())).map((t) => ({
      from_nickname: t.from_player_name,
      to_nickname: t.to_player_name,
      amount: new Prisma.Decimal(t.amount.toString()),
    }));
  }

  const label = formatWeekLabel(week);

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
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#d4a437",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {club.name}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 600, marginTop: 6 }}>
            {status === "closed" ? "Weekly settle-up" : "Weekly preview"}
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#9b948a", marginTop: 4 }}>
            {label} · Online
          </div>
        </div>

        {/* Transfers */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 10 }}>
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
                  padding: "18px 24px",
                  background: "#16140f",
                  borderRadius: 14,
                  fontSize: 30,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ color: "#9b948a" }}>{t.from_nickname}</span>
                  <span style={{ color: "#5b554b" }}>→</span>
                  <span style={{ fontWeight: 600 }}>{t.to_nickname}</span>
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
            {transfers.length} transfer{transfers.length !== 1 ? "s" : ""}
            {status === "preview" ? " · preview" : ""}
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
