"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type CreateUserState = {
  error?: string;
  success?: {
    login: string;
    tempPassword: string; // shown once to super-admin, then never again
  };
};

const schema = z.object({
  login: z
    .string()
    .trim()
    .min(3, "Login must be at least 3 characters.")
    .max(64)
    .regex(/^[a-z0-9_-]+$/i, "Login: letters, digits, _ and - only.")
    .transform((s) => s.toLowerCase()),
  display_name: z.string().trim().min(1, "Display name required.").max(128),
  club_id: z.string().uuid().optional().or(z.literal("")),
  role: z.enum(["player", "host"]),
  nickname: z.string().trim().max(64).optional().or(z.literal("")),
});

/**
 * Generate a human-readable temporary password.
 * Format: 4 lowercase words pattern (~10 chars). Easy to read out loud / Telegram.
 * Strength: ~52 bits — fine for a one-time password that must be changed on first login.
 */
function generateTempPassword(): string {
  // Use crypto.getRandomValues for proper entropy.
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  // Base64 → strip non-alnum, take first 12 chars
  const b64 = Buffer.from(bytes).toString("base64");
  const cleaned = b64.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  return cleaned;
}

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };

  const parsed = schema.safeParse({
    login: formData.get("login"),
    display_name: formData.get("display_name"),
    club_id: formData.get("club_id"),
    role: formData.get("role"),
    nickname: formData.get("nickname"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  // Login uniqueness
  const existing = await db.users.findUnique({ where: { login: data.login } });
  if (existing) {
    return { error: `Login "${data.login}" is already taken.` };
  }

  // If club_id provided, validate it and require nickname
  let clubMembership: { club_id: string; nickname: string } | null = null;
  if (data.club_id && data.club_id.length > 0) {
    const club = await db.clubs.findUnique({ where: { id: data.club_id } });
    if (!club) return { error: "Selected club no longer exists." };
    const nick = data.nickname && data.nickname.length > 0 ? data.nickname : data.display_name;
    clubMembership = { club_id: data.club_id, nickname: nick };
  }

  const tempPassword = generateTempPassword();
  const password_hash = await bcrypt.hash(tempPassword, 12);

  // Create user + (optionally) club_member in one transaction
  await db.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        login: data.login,
        display_name: data.display_name,
        password_hash,
        password_changed_at: null, // forces first-login password change
      },
    });

    if (clubMembership) {
      await tx.club_members.create({
        data: {
          club_id: clubMembership.club_id,
          user_id: user.id,
          role: data.role,
          nickname: clubMembership.nickname,
        },
      });
    }
  });

  revalidatePath("/admin/users");
  return {
    success: {
      login: data.login,
      tempPassword,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Update / membership / reset password / deactivate
// ─────────────────────────────────────────────────────────────

export type SimpleState = { error?: string; success?: string };
export type ResetPasswordState = {
  error?: string;
  success?: { login: string; tempPassword: string };
};

const updateDisplayNameSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().trim().min(1).max(128),
});

export async function updateDisplayNameAction(
  _prev: SimpleState,
  fd: FormData
): Promise<SimpleState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };
  const parsed = updateDisplayNameSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await db.users.update({
    where: { id: parsed.data.user_id },
    data: { display_name: parsed.data.display_name },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.user_id}`);
  return { success: "Updated." };
}

const updateMembershipSchema = z.object({
  membership_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["player", "host"]),
  nickname: z.string().trim().min(1).max(64),
  status: z.enum(["active", "inactive"]),
});

export async function updateMembershipAction(
  _prev: SimpleState,
  fd: FormData
): Promise<SimpleState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };
  const parsed = updateMembershipSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const membership = await db.club_members.findUnique({
    where: { id: parsed.data.membership_id },
    select: { user_id: true, status: true },
  });
  if (!membership || membership.user_id !== parsed.data.user_id) {
    return { error: "Membership not found." };
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
    data.status_changed_by = session.user.id;
    data.inactive_reason = parsed.data.status === "inactive" ? "deactivated by admin" : null;
  }
  await db.club_members.update({
    where: { id: parsed.data.membership_id },
    data,
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.user_id}`);
  return { success: "Updated." };
}

const addMembershipSchema = z.object({
  user_id: z.string().uuid(),
  club_id: z.string().uuid(),
  role: z.enum(["player", "host"]),
  nickname: z.string().trim().min(1).max(64),
});

export async function addMembershipAction(
  _prev: SimpleState,
  fd: FormData
): Promise<SimpleState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };
  const parsed = addMembershipSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  // Already a member?
  const existing = await db.club_members.findFirst({
    where: { user_id: parsed.data.user_id, club_id: parsed.data.club_id },
  });
  if (existing) {
    return { error: "User is already a member of this club." };
  }
  await db.club_members.create({
    data: {
      user_id: parsed.data.user_id,
      club_id: parsed.data.club_id,
      role: parsed.data.role,
      nickname: parsed.data.nickname,
      status: "active",
    },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.user_id}`);
  return { success: "Added to club." };
}

const removeMembershipSchema = z.object({
  membership_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

export async function removeMembershipAction(
  _prev: SimpleState,
  fd: FormData
): Promise<SimpleState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };
  const parsed = removeMembershipSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input." };

  const membership = await db.club_members.findUnique({
    where: { id: parsed.data.membership_id },
    select: {
      id: true,
      user_id: true,
      current_balance: true,
      _count: {
        select: {
          ledger_entries: true,
          session_participants: true,
        },
      },
    },
  });
  if (!membership || membership.user_id !== parsed.data.user_id) {
    return { error: "Membership not found." };
  }
  if (
    membership._count.ledger_entries > 0 ||
    membership._count.session_participants > 0 ||
    !membership.current_balance.eq(0)
  ) {
    return {
      error:
        "Cannot remove: this membership has activity. Deactivate it instead (status → inactive).",
    };
  }
  await db.club_members.delete({ where: { id: parsed.data.membership_id } });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.user_id}`);
  return { success: "Removed from club." };
}

const resetPasswordSchema = z.object({
  user_id: z.string().uuid(),
});

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  fd: FormData
): Promise<ResetPasswordState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input." };

  const u = await db.users.findUnique({
    where: { id: parsed.data.user_id },
    select: { id: true, login: true },
  });
  if (!u) return { error: "User not found." };

  const tempPassword = generateTempPassword();
  const password_hash = await bcrypt.hash(tempPassword, 12);

  await db.users.update({
    where: { id: u.id },
    data: { password_hash, password_changed_at: null },
  });
  revalidatePath(`/admin/users/${u.id}`);
  return { success: { login: u.login, tempPassword } };
}

const deactivateUserSchema = z.object({
  user_id: z.string().uuid(),
});

export async function deactivateUserAction(
  _prev: SimpleState,
  fd: FormData
): Promise<SimpleState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };
  const parsed = deactivateUserSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input." };

  if (parsed.data.user_id === session.user.id) {
    return { error: "Cannot deactivate yourself." };
  }

  // Mark all memberships inactive
  await db.club_members.updateMany({
    where: { user_id: parsed.data.user_id },
    data: {
      status: "inactive",
      status_changed_at: new Date(),
      status_changed_by: session.user.id,
      inactive_reason: "user deactivated",
    },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.user_id}`);
  return { success: "User deactivated across all clubs." };
}

import { redirect } from "next/navigation";

const deleteUserSchema = z.object({
  user_id: z.string().uuid(),
});

export async function deleteUserAction(
  _prev: SimpleState,
  fd: FormData
): Promise<SimpleState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };
  const parsed = deleteUserSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input." };

  if (parsed.data.user_id === session.user.id) {
    return { error: "Cannot delete yourself." };
  }

  const u = await db.users.findUnique({
    where: { id: parsed.data.user_id },
    select: {
      id: true,
      is_superuser: true,
      _count: {
        select: {
          ledger_entries: true,
          sessions_sessions_host_idTousers: true,
        },
      },
      club_members_club_members_user_idTousers: {
        select: {
          _count: { select: { ledger_entries: true, session_participants: true } },
        },
      },
    },
  });
  if (!u) return { error: "User not found." };
  if (u.is_superuser) return { error: "Cannot delete a super-admin." };

  if (u._count.ledger_entries > 0 || u._count.sessions_sessions_host_idTousers > 0) {
    return { error: "User has activity (ledger/sessions). Deactivate instead." };
  }
  for (const m of u.club_members_club_members_user_idTousers) {
    if (m._count.ledger_entries > 0 || m._count.session_participants > 0) {
      return { error: "User has activity in some club. Deactivate instead." };
    }
  }

  // Cascade deletes club_members. Other refs already verified empty.
  await db.users.delete({ where: { id: u.id } });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
