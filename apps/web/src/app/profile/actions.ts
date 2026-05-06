"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type ChangePasswordState = { error?: string; success?: string };

const MIN_LEN = 8;

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!current || !next || !confirm) {
    return { error: "All fields are required." };
  }
  if (next.length < MIN_LEN) {
    return { error: `New password must be at least ${MIN_LEN} characters.` };
  }
  if (next !== confirm) {
    return { error: "New passwords do not match." };
  }
  if (next === current) {
    return { error: "New password must be different from the current one." };
  }

  const user = await db.users.findUnique({
    where: { id: session.user.id },
    select: { id: true, password_hash: true },
  });
  if (!user) return { error: "User not found." };

  const ok = await bcrypt.compare(current, user.password_hash);
  if (!ok) return { error: "Current password is incorrect." };

  const hash = await bcrypt.hash(next, 10);
  await db.users.update({
    where: { id: user.id },
    data: { password_hash: hash, password_changed_at: new Date() },
  });

  return { success: "Password updated." };
}
