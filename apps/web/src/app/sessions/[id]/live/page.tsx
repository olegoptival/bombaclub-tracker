import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import { LiveView } from "./view";

export const metadata = { title: "Live session · Bombaclub Tracker" };
export const dynamic = "force-dynamic";

export default async function LivePage({
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
      tables: true,
      session_participants: {
        include: {
          club_members: { select: { id: true, nickname: true } },
          buy_in_events: { where: { deleted_at: null }, orderBy: { occurred_at: "asc" } },
          cash_out_events: { where: { deleted_at: null }, orderBy: { occurred_at: "asc" } },
        },
      },
    },
  });
  if (!session) notFound();
  if (session.club_id !== ctx.activeClub.club_id) redirect("/");
  if (session.type !== "offline") redirect(`/sessions/${id}`);

  const isHost =
    session.host_id === ctx.user.id || session.co_host_id === ctx.user.id;
  if (!isHost) redirect(`/sessions/${id}`);

  if (session.status !== "in_progress") redirect(`/sessions/${id}`);

  const table = session.tables[0]!;

  type Row = {
    id: string;
    name: string;
    isGuest: boolean;
    totalBuyIn: string;
    buyInCount: number;
    cashedOut: boolean;
    stack: string | null;
    pnl: string | null;
  };
  const rows: Row[] = session.session_participants.map((p) => {
    const totalBuyIn = p.buy_in_events.reduce(
      (s, e) => s.add(e.amount),
      new Prisma.Decimal(0)
    );
    const totalCashOut = p.cash_out_events.reduce(
      (s, e) => s.add(e.stack_amount),
      new Prisma.Decimal(0)
    );
    const cashedOut = p.cash_out_events.length > 0;
    return {
      id: p.id,
      name: p.club_members?.nickname ?? p.guest_name ?? "Unknown",
      isGuest: !p.club_member_id,
      totalBuyIn: totalBuyIn.toFixed(2),
      buyInCount: p.buy_in_events.length,
      cashedOut,
      stack: cashedOut ? totalCashOut.toFixed(2) : null,
      pnl: cashedOut ? totalCashOut.sub(totalBuyIn).toFixed(2) : null,
    };
  });

  const seated = rows.filter((r) => !r.cashedOut && r.buyInCount > 0);
  const cashedOut = rows.filter((r) => r.cashedOut);

  const totalChips = rows.reduce(
    (s, r) =>
      r.cashedOut
        ? s
        : s.add(new Prisma.Decimal(r.totalBuyIn)),
    new Prisma.Decimal(0)
  );

  // Members of this club not yet at the table
  const allMembers = await db.club_members.findMany({
    where: { club_id: session.club_id, status: "active" },
    select: { id: true, nickname: true },
    orderBy: { nickname: "asc" },
  });
  const seatedMemberIds = new Set(
    session.session_participants
      .map((p) => p.club_member_id)
      .filter((x): x is string => !!x)
  );
  const availableMembers = allMembers.filter((m) => !seatedMemberIds.has(m.id));

  return (
    <LiveView
      sessionId={id}
      titleLine={`${table.game_type ?? "NLH"}${table.blinds ? ` ${table.blinds}` : ""}`}
      title={session.title ?? null}
      startedAt={session.started_at?.toISOString() ?? null}
      seated={seated}
      cashedOut={cashedOut}
      totalChips={totalChips.toFixed(2)}
      availableMembers={availableMembers}
      defaultBuyIn={table.min_buy_in?.toFixed(2) ?? ""}
    />
  );
}
