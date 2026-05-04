import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import { MatchingWizard } from "./wizard";

export const metadata = { title: "Match players · Bombaclub Tracker" };
export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAppContext();

  const session = await db.sessions.findUnique({ where: { id } });
  if (!session) notFound();
  if (session.host_id !== ctx.user.id) redirect("/");
  if (session.type !== "online") redirect(`/sessions/${id}`);
  if (session.status !== "created") redirect(`/sessions/${id}`);

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 100px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link
          href={`/sessions/${id}/upload`}
          style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}
        >
          ← Back to upload
        </Link>
        <div style={{ marginTop: 18, marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
            Match players
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>
            Connect each parsed player to a club member, or keep them as a guest.
          </p>
        </div>

        <MatchingWizard sessionId={id} />
      </div>
    </main>
  );
}
