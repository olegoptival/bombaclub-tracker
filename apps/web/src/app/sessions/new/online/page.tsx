import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewOnlineSessionPage() {
  const ctx = await getAppContext();
  const club = ctx.activeClub;

  if (!club || club.role !== "host") {
    redirect("/");
  }

  // Reuse the host's existing draft online session, if any. Otherwise create one.
  const existing = await db.sessions.findFirst({
    where: {
      club_id: club.club_id,
      host_id: ctx.user.id,
      type: "online",
      status: "created",
    },
    orderBy: { created_at: "desc" },
  });

  const sessionId = existing
    ? existing.id
    : (
        await db.sessions.create({
          data: {
            club_id: club.club_id,
            host_id: ctx.user.id,
            type: "online",
            status: "created",
          },
          select: { id: true },
        })
      ).id;

  redirect(`/sessions/${sessionId}/upload`);
}
