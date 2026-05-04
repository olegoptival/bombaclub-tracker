"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type CreateOfflineState = { error?: string };

const schema = z.object({
  club_id: z.string().uuid(),
  title: z.string().trim().max(255).optional().or(z.literal("")),
  game_type: z.enum(["NLH", "PLO", "PLO5", "Other"]),
  blinds: z.string().trim().max(16).optional().or(z.literal("")),
  buy_in_min: z.coerce.number().nonnegative().optional(),
  buy_in_max: z.coerce.number().nonnegative().optional(),
  co_host_id: z.string().uuid().optional().or(z.literal("")),
});

export async function createOfflineSessionAction(
  _prev: CreateOfflineState,
  formData: FormData
): Promise<CreateOfflineState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  const get = (k: string) => {
    const v = formData.get(k);
    return v === null ? "" : v;
  };
  const parsed = schema.safeParse({
    club_id: get("club_id"),
    title: get("title"),
    game_type: get("game_type"),
    blinds: get("blinds"),
    buy_in_min: formData.get("buy_in_min") || undefined,
    buy_in_max: formData.get("buy_in_max") || undefined,
    co_host_id: get("co_host_id"),
  });
  if (!parsed.success) {
    console.error("offline session validation failed", parsed.error.issues);
    const issue = parsed.error.issues[0];
    const msg = issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid input.";
    return { error: msg };
  }

  // Verify caller is a host in this club
  const callerMembership = await db.club_members.findFirst({
    where: {
      club_id: parsed.data.club_id,
      user_id: session.user.id,
      status: "active",
      role: "host",
    },
  });
  if (!callerMembership) return { error: "Only club hosts can create sessions." };

  const data = parsed.data;
  const now = new Date();

  const newSession = await db.$transaction(async (tx) => {
    const s = await tx.sessions.create({
      data: {
        club_id: data.club_id,
        host_id: session.user.id,
        co_host_id: data.co_host_id || null,
        type: "offline",
        status: "in_progress",
        title: data.title || null,
        started_at: now,
        last_activity_at: now,
      },
      select: { id: true },
    });

    await tx.tables.create({
      data: {
        session_id: s.id,
        name: data.title || null,
        game_type: data.game_type,
        blinds: data.blinds || null,
        min_buy_in: data.buy_in_min !== undefined ? new Prisma.Decimal(data.buy_in_min) : null,
        max_buy_in: data.buy_in_max !== undefined ? new Prisma.Decimal(data.buy_in_max) : null,
      },
    });

    return s;
  });

  redirect(`/sessions/${newSession.id}/live`);
}
