import { Prisma } from "@prisma/client";
import { db } from "../db";
import type { OcrResult } from "./schema";

const PLATFORM = "ClubGG";

export async function persistOcrResult(input: {
  importId: string;
  sessionId: string;
  result: OcrResult;
}) {
  const { importId, sessionId, result } = input;

  const session = await db.sessions.findUnique({
    where: { id: sessionId },
    select: { club_id: true },
  });
  if (!session) throw new Error(`session not found: ${sessionId}`);

  const aliases = await db.member_aliases.findMany({
    where: {
      source: PLATFORM,
      club_members: { club_id: session.club_id },
    },
    select: { alias_name: true, alias_id: true, club_member_id: true },
  });

  const matchByAliasId = new Map<string, string>();
  const matchByName = new Map<string, string>();
  for (const a of aliases) {
    if (a.alias_id) matchByAliasId.set(a.alias_id, a.club_member_id);
    matchByName.set(a.alias_name.toLowerCase(), a.club_member_id);
  }

  for (const p of result.players) {
    const memberId =
      (p.id ? matchByAliasId.get(p.id) : undefined) ??
      matchByName.get(p.name.toLowerCase()) ??
      null;

    let participantId: string;

    if (memberId) {
      const existing = await db.session_participants.findUnique({
        where: { session_id_club_member_id: { session_id: sessionId, club_member_id: memberId } },
        select: { id: true },
      });
      participantId = existing
        ? existing.id
        : (
            await db.session_participants.create({
              data: { session_id: sessionId, club_member_id: memberId },
              select: { id: true },
            })
          ).id;
    } else {
      const existing = await db.session_participants.findFirst({
        where: {
          session_id: sessionId,
          club_member_id: null,
          guest_name: p.name,
        },
        select: { id: true },
      });
      participantId = existing
        ? existing.id
        : (
            await db.session_participants.create({
              data: { session_id: sessionId, guest_name: p.name },
              select: { id: true },
            })
          ).id;
    }

    await db.ocr_screen_results.upsert({
      where: {
        ocr_import_id_participant_id: {
          ocr_import_id: importId,
          participant_id: participantId,
        },
      },
      create: {
        ocr_import_id: importId,
        participant_id: participantId,
        recognized_name: p.name,
        recognized_alias_id: p.id ?? null,
        profit_loss: new Prisma.Decimal(p.profit_loss),
        fee: new Prisma.Decimal(p.fee),
      },
      update: {
        recognized_name: p.name,
        recognized_alias_id: p.id ?? null,
        profit_loss: new Prisma.Decimal(p.profit_loss),
        fee: new Prisma.Decimal(p.fee),
      },
    });
  }
}
