"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";

export type ChangePasswordState = { error?: string };

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current one.",
  });

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not signed in." };
  }

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await db.users.findUnique({
    where: { id: session.user.id },
    select: { id: true, password_hash: true },
  });
  if (!user) {
    return { error: "User not found." };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
  if (!ok) {
    return { error: "Current password is incorrect." };
  }

  const password_hash = await bcrypt.hash(parsed.data.newPassword, 12);

  await db.users.update({
    where: { id: user.id },
    data: {
      password_hash,
      password_changed_at: new Date(),
    },
  });

  // Force re-login so the JWT picks up the new password_changed_at value
  await signOut({ redirect: false });
  redirect("/login?changed=1");
}
