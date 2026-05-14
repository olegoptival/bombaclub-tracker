import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import { GeneralForm } from "./general-form";
import { MemberRow } from "./member-row";
import { AddMemberForm } from "./add-member-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Club settings · Bombaclub Tracker" };

export default async function ClubSettingsPage() {
  const ctx = await getAppContext();
  if (!ctx.activeClub) redirect("/");

  const isHostOrAdmin =
    ctx.activeClub.role === "host" || ctx.user.isSuperuser;
  if (!isHostOrAdmin) redirect("/");

  const clubId = ctx.activeClub.club_id;

  const club = await db.clubs.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      name: true,
      settlement_period: true,
      dispute_window_days: true,
      required_aliases: true,
    },
  });
  if (!club) redirect("/");

  // All members + activity counts (to gate Remove)
  const members = await db.club_members.findMany({
    where: { club_id: clubId },
    orderBy: [{ role: "desc" }, { status: "asc" }, { nickname: "asc" }],
    select: {
      id: true,
      nickname: true,
      role: true,
      status: true,
      current_balance: true,
      user_id: true,
      _count: {
        select: { ledger_entries: true, session_participants: true },
      },
    },
  });

  // Users not yet in this club — for "Add existing user" dropdown
  const memberUserIds = members.map((m) => m.user_id);
  const availableUsers = await db.users.findMany({
    where: { id: { notIn: memberUserIds.length ? memberUserIds : ["00000000-0000-0000-0000-000000000000"] } },
    orderBy: { display_name: "asc" },
    select: { id: true, login: true, display_name: true },
  });

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}
        >
          ← Back
        </Link>

        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "14px 0 18px" }}>
          {club.name} · settings
        </h1>

        <GeneralForm
          initial={{
            name: club.name,
            settlement_period: club.settlement_period,
            dispute_window_days: club.dispute_window_days,
            required_aliases: club.required_aliases,
          }}
        />

        <div className="pkr-card" style={{ padding: 16 }}>
          <div className="pkr-section-label" style={{ marginBottom: 4 }}>
            Members · {members.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                membershipId={m.id}
                nickname={m.nickname}
                role={m.role as "player" | "host"}
                status={m.status as "active" | "inactive"}
                currentBalance={m.current_balance.toString()}
                hasActivity={
                  m._count.ledger_entries > 0 ||
                  m._count.session_participants > 0 ||
                  !m.current_balance.eq(0)
                }
                isMe={m.user_id === ctx.user.id}
              />
            ))}
          </div>
          <AddMemberForm availableUsers={availableUsers} />
        </div>
      </div>
    </main>
  );
}
