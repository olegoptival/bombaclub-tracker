import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const dbSession = await db.sessions.findUnique({
    where: { id: sessionId },
    select: { host_id: true, club_id: true },
  });
  if (!dbSession) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (dbSession.host_id !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const participants = await db.session_participants.findMany({
    where: { session_id: sessionId },
    include: {
      ocr_screen_results: { select: { profit_loss: true, recognized_alias_id: true } },
      club_members: { select: { id: true, nickname: true } },
    },
  });

  // Aggregate P&L across all screens
  const items = participants.map((p) => {
    const total = p.ocr_screen_results.reduce(
      (acc, r) => acc.add(r.profit_loss),
      new Prisma.Decimal(0)
    );
    const aliasIds = Array.from(
      new Set(p.ocr_screen_results.map((r) => r.recognized_alias_id).filter(Boolean))
    );
    return {
      id: p.id,
      club_member_id: p.club_member_id,
      member_nickname: p.club_members?.nickname ?? null,
      guest_name: p.guest_name,
      total_pnl: total.toFixed(2),
      alias_ids: aliasIds,
      screens_count: p.ocr_screen_results.length,
    };
  });

  // Members of this club for the picker
  const members = await db.club_members.findMany({
    where: { club_id: dbSession.club_id, status: "active" },
    select: { id: true, nickname: true },
    orderBy: { nickname: "asc" },
  });

  return NextResponse.json({ participants: items, members });
}
