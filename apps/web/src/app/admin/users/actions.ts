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
