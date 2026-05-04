import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import { ReviewForm } from "./form";

export const metadata = { title: "Review session · Bombaclub Tracker" };
export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAppContext();

  const session = await db.sessions.findUnique({ where: { id } });
  if (!session) notFound();
  if (session.host_id !== ctx.user.id) redirect("/");
  if (session.status !== "created") redirect(`/sessions/${id}`);

  const participants = await db.session_participants.findMany({
    where: { session_id: id },
    include: {
      ocr_screen_results: { select: { profit_loss: true } },
      club_members: { select: { nickname: true } },
    },
  });

  const rows = participants
    .map((p) => {
      const total = p.ocr_screen_results.reduce(
        (acc, r) => acc.add(r.profit_loss),
        new Prisma.Decimal(0)
      );
      return {
        id: p.id,
        name: p.club_members?.nickname ?? p.guest_name ?? "Unknown",
        is_guest: !p.club_member_id,
        total: total.toFixed(2),
      };
    })
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

  const sum = participants.reduce(
    (acc, p) =>
      acc.add(
        p.ocr_screen_results.reduce(
          (s, r) => s.add(r.profit_loss),
          new Prisma.Decimal(0)
        )
      ),
    new Prisma.Decimal(0)
  );

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link
          href={`/sessions/${id}/match`}
          style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}
        >
          ← Back to matching
        </Link>
        <div style={{ marginTop: 18, marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
            Review session
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>
            Confirm the totals before saving. After saving, balances update for matched members.
          </p>
        </div>

        <ReviewForm sessionId={id} rows={rows} sumOff={sum.toFixed(2)} />
      </div>
    </main>
  );
}
