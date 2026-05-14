import { ImageResponse } from "next/og";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseWeekParam, weekRangeUtc, formatWeekLabel } from "@/app/week/week-utils";

export const runtime = "nodejs";

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
  });

  // Aggregate per player
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

  const rows = Array.from(map.values()).sort(
    (a, b) => parseFloat(b.pnl.toString()) - parseFloat(a.pnl.toString())
  );

  const totalSessions = sessions.length;
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
            Weekly results
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#9b948a", marginTop: 4 }}>
            {label} · Online
          </div>
        </div>

        {/* Player rows */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
          {rows.length === 0 ? (
            <div style={{ fontSize: 24, color: "#9b948a" }}>
              No online sessions this week.
            </div>
          ) : (
            rows.map((r, i) => {
              const num = parseFloat(r.pnl.toString());
              const color = num > 0 ? "#7fa97a" : num < 0 ? "#d97565" : "#9b948a";
              const sign = num > 0 ? "+" : num < 0 ? "−" : "";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 22px",
                    background: "#16140f",
                    borderRadius: 12,
                    fontSize: 26,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 600 }}>{r.nickname}</span>
                    <span style={{ color: "#5b554b", fontSize: 18 }}>
                      {r.sessions_count}s
                    </span>
                  </div>
                  <span style={{ color, fontWeight: 600 }}>
                    {sign}{Math.abs(num).toFixed(2)}
                  </span>
                </div>
              );
            })
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
            {rows.length} player{rows.length !== 1 ? "s" : ""} · {totalSessions} session{totalSessions !== 1 ? "s" : ""}
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
