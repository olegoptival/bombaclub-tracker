import { redirect } from "next/navigation";
import Link from "next/link";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import { OfflineSetupForm } from "./form";

export const metadata = { title: "New offline session · Bombaclub Tracker" };
export const dynamic = "force-dynamic";

export default async function NewOfflineSessionPage() {
  const ctx = await getAppContext();
  const club = ctx.activeClub;
  if (!club || club.role !== "host") redirect("/");

  // If host already has an in_progress offline session, jump straight to its live view
  const ongoing = await db.sessions.findFirst({
    where: {
      club_id: club.club_id,
      host_id: ctx.user.id,
      type: "offline",
      status: "in_progress",
    },
    orderBy: { started_at: "desc" },
  });
  if (ongoing) redirect(`/sessions/${ongoing.id}/live`);

  // Eligible co-hosts: other hosts in this club
  const coHosts = await db.club_members.findMany({
    where: {
      club_id: club.club_id,
      role: "host",
      status: "active",
      user_id: { not: ctx.user.id },
    },
    select: { id: true, nickname: true, user_id: true },
    orderBy: { nickname: "asc" },
  });

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link href="/sessions/new" style={{ fontSize: 13, color: "var(--fg-2)" }}>
          ← Back
        </Link>
        <div style={{ marginTop: 18, marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
            New offline session
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>
            Set up the table, then start. You can update events as the game goes.
          </p>
        </div>

        <OfflineSetupForm
          clubId={club.club_id}
          coHosts={coHosts.map((c) => ({ id: c.user_id, name: c.nickname }))}
        />
      </div>
    </main>
  );
}
