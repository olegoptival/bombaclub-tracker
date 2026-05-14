"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";

export type ClubActionState = { error?: string; success?: string };
export type AddMemberState = {
  error?: string;
  success?: { login: string; tempPassword?: string };
};

// ─── Helpers ────────────────────────────────────────────────────────

async function requireHostOrAdmin() {
  const ctx = await getAppContext();
  if (!ctx.activeClub) return { error: "No active club" as const };
  const ok =
    ctx.activeClub.role === "host" || ctx.user.isSuperuser;
  if (!ok) return { error: "Forbidden" as const };
  return { ctx };
}

function generateTempPassword(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
}

// ─── General settings ──────────────────────────────────────────────

const generalSchema = z.object({
  name: z.string().trim().min(1).max(128),
  settlement_period: z.enum(["day", "week", "month", "manual"]),
  dispute_window_days: z.coerce.number().int().min(1).max(90),
  required_aliases: z.string().trim().max(512).optional().default(""),
});

export async function updateClubGeneralAction(
  _prev: ClubActionState,
  fd: FormData
): Promise<ClubActionState> {
  const auth = await requireHostOrAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = generalSchema.safeParse({
    name: fd.get("name"),
    settlement_period: fd.get("settlement_period"),
    dispute_window_days: fd.get("dispute_window_days"),
    required_aliases: fd.get("required_aliases"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const aliases = parsed.data.required_aliases
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  await db.clubs.update({
    where: { id: auth.ctx.activeClub!.club_id },
    data: {
      name: parsed.data.name,
      settlement_period: parsed.data.settlement_period,
      dispute_window_days: parsed.data.dispute_window_days,
      required_aliases: aliases,
    },
  });

  revalidatePath("/club/settings");
  return { success: "Club settings saved" };
}

// ─── Member actions ────────────────────────────────────────────────

const updateMemberSchema = z.object({
  membership_id: z.string().uuid(),
  role: z.enum(["player", "host"]),
  nickname: z.string().trim().min(1).max(64),
  status: z.enum(["active", "inactive"]),
});

export async function updateMemberAction(
  _prev: ClubActionState,
  fd: FormData
): Promise<ClubActionState> {
  const auth = await requireHostOrAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = updateMemberSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const membership = await db.club_members.findUnique({
    where: { id: parsed.data.membership_id },
    select: { id: true, club_id: true, status: true, role: true },
  });
  if (!membership || membership.club_id !== auth.ctx.activeClub!.club_id) {
    return { error: "Member not found in this club" };
  }

  // Prevent demoting the last host
  if (membership.role === "host" && parsed.data.role !== "host") {
    const otherHosts = await db.club_members.count({
      where: {
        club_id: membership.club_id,
        role: "host",
        status: "active",
        id: { not: membership.id },
      },
    });
    if (otherHosts === 0) {
      return { error: "Cannot demote the last active host. Promote another member first." };
    }
  }

  const data: {
    role: "player" | "host";
    nickname: string;
    status: "active" | "inactive";
    status_changed_at?: Date;
    status_changed_by?: string;
    inactive_reason?: string | null;
  } = {
    role: parsed.data.role,
    nickname: parsed.data.nickname,
    status: parsed.data.status,
  };
  if (membership.status !== parsed.data.status) {
    data.status_changed_at = new Date();
    data.status_changed_by = auth.ctx.user.id;
    data.inactive_reason =
      parsed.data.status === "inactive" ? "deactivated by host" : null;
  }

  await db.club_members.update({
    where: { id: parsed.data.membership_id },
    data,
  });

  revalidatePath("/club/settings");
  return { success: "Member updated" };
}

// Add existing user as member
const addExistingSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["player", "host"]),
  nickname: z.string().trim().min(1).max(64),
});

export async function addExistingMemberAction(
  _prev: AddMemberState,
  fd: FormData
): Promise<AddMemberState> {
  const auth = await requireHostOrAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = addExistingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const clubId = auth.ctx.activeClub!.club_id;
  const existing = await db.club_members.findFirst({
    where: { user_id: parsed.data.user_id, club_id: clubId },
    select: { id: true },
  });
  if (existing) return { error: "User is already a member of this club" };

  const user = await db.users.findUnique({
    where: { id: parsed.data.user_id },
    select: { id: true, login: true },
  });
  if (!user) return { error: "User not found" };

  await db.club_members.create({
    data: {
      user_id: parsed.data.user_id,
      club_id: clubId,
      role: parsed.data.role,
      nickname: parsed.data.nickname,
      status: "active",
    },
  });

  revalidatePath("/club/settings");
  return { success: { login: user.login } };
}

// Create user + add as member in one shot
const createMemberSchema = z.object({
  login: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9_-]+$/i)
    .transform((s) => s.toLowerCase()),
  display_name: z.string().trim().min(1).max(128),
  nickname: z.string().trim().min(1).max(64),
  role: z.enum(["player", "host"]),
});

export async function createAndAddMemberAction(
  _prev: AddMemberState,
  fd: FormData
): Promise<AddMemberState> {
  const auth = await requireHostOrAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = createMemberSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const clubId = auth.ctx.activeClub!.club_id;

  const taken = await db.users.findUnique({
    where: { login: parsed.data.login },
    select: { id: true },
  });
  if (taken) return { error: `Login "${parsed.data.login}" is taken` };

  const tempPassword = generateTempPassword();
  const password_hash = await bcrypt.hash(tempPassword, 12);

  await db.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        login: parsed.data.login,
        display_name: parsed.data.display_name,
        password_hash,
        password_changed_at: null,
      },
    });
    await tx.club_members.create({
      data: {
        user_id: user.id,
        club_id: clubId,
        role: parsed.data.role,
        nickname: parsed.data.nickname,
        status: "active",
      },
    });
  });

  revalidatePath("/club/settings");
  return {
    success: { login: parsed.data.login, tempPassword },
  };
}

// Remove member (only if no activity)
const removeMemberSchema = z.object({
  membership_id: z.string().uuid(),
});

export async function removeMemberAction(
  _prev: ClubActionState,
  fd: FormData
): Promise<ClubActionState> {
  const auth = await requireHostOrAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = removeMemberSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input" };

  const member = await db.club_members.findUnique({
    where: { id: parsed.data.membership_id },
    select: {
      id: true,
      club_id: true,
      role: true,
      current_balance: true,
      _count: { select: { ledger_entries: true, session_participants: true } },
    },
  });
  if (!member || member.club_id !== auth.ctx.activeClub!.club_id) {
    return { error: "Member not found" };
  }
  if (
    member._count.ledger_entries > 0 ||
    member._count.session_participants > 0 ||
    !member.current_balance.eq(0)
  ) {
    return {
      error: "Has activity. Deactivate instead.",
    };
  }
  if (member.role === "host") {
    const otherHosts = await db.club_members.count({
      where: {
        club_id: member.club_id,
        role: "host",
        status: "active",
        id: { not: member.id },
      },
    });
    if (otherHosts === 0) {
      return { error: "Cannot remove the last active host" };
    }
  }

  await db.club_members.delete({ where: { id: parsed.data.membership_id } });
  revalidatePath("/club/settings");
  return { success: "Member removed" };
}
