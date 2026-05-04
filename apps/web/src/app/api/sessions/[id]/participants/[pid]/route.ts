import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const PLATFORM = "ClubGG";

const matchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("match"),
    club_member_id: z.string().uuid(),
    save_alias: z.boolean().default(true),
  }),
  z.object({ action: z.literal("guest") }),
  z.object({ action: z.literal("delete") }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id: sessionId, pid: participantId } = await params;
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

  const participant = await db.session_participants.findUnique({
    where: { id: participantId },
    include: {
      ocr_screen_results: { select: { recognized_name: true, recognized_alias_id: true } },
    },
  });
  if (!participant || participant.session_id !== sessionId) {
    return NextResponse.json({ error: "participant not found" }, { status: 404 });
  }

  const body = matchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (body.data.action === "delete") {
    await db.session_participants.delete({ where: { id: participantId } });
    return NextResponse.json({ ok: true });
  }

  if (body.data.action === "guest") {
    // Already a guest if club_member_id is null. If host previously matched and is reverting,
    // we'd need to clear club_member_id but keep guest_name from OCR.
    if (participant.club_member_id) {
      const guestName = participant.ocr_screen_results[0]?.recognized_name ?? "Guest";
      await db.session_participants.update({
        where: { id: participantId },
        data: { club_member_id: null, guest_name: guestName },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // match action
  if (body.data.action !== "match") {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  const memberId = body.data.club_member_id;
  const saveAlias = body.data.save_alias;
  const member = await db.club_members.findUnique({
    where: { id: memberId },
    select: { id: true, club_id: true },
  });
  if (!member || member.club_id !== dbSession.club_id) {
    return NextResponse.json({ error: "member not in this club" }, { status: 400 });
  }

  // Conflict: this club_member already a participant? Merge by reassigning screen_results.
  const conflict = await db.session_participants.findFirst({
    where: { session_id: sessionId, club_member_id: memberId, NOT: { id: participantId } },
  });

  await db.$transaction(async (tx) => {
    if (conflict) {
      // Move screen_results from current participant to the conflicting one, then delete current
      await tx.ocr_screen_results.updateMany({
        where: { participant_id: participantId },
        data: { participant_id: conflict.id },
      });
      await tx.session_participants.delete({ where: { id: participantId } });
    } else {
      await tx.session_participants.update({
        where: { id: participantId },
        data: { club_member_id: memberId, guest_name: null },
      });
    }

    if (saveAlias) {
      // Save aliases (name + alias_id) so future OCRs auto-match
      const seen = new Set<string>();
      for (const r of participant.ocr_screen_results) {
        if (!r.recognized_name) continue;
        const key = `${r.recognized_name}|${r.recognized_alias_id ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);

        await tx.member_aliases.upsert({
          where: {
            source_alias_name_alias_id: {
              source: PLATFORM,
              alias_name: r.recognized_name,
              alias_id: r.recognized_alias_id ?? "",
            },
          },
          create: {
            club_member_id: memberId,
            source: PLATFORM,
            alias_name: r.recognized_name,
            alias_id: r.recognized_alias_id ?? null,
          },
          update: { club_member_id: memberId },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
