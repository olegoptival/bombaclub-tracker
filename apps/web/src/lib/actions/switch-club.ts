"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function switchClubAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const clubId = String(formData.get("club_id") ?? "");
  if (!clubId) return;

  const membership = await db.club_members.findFirst({
    where: {
      user_id: session.user.id,
      club_id: clubId,
      status: "active",
    },
    select: { id: true },
  });
  if (!membership) return;

  await db.users.update({
    where: { id: session.user.id },
    data: { current_club_id: clubId },
  });

  revalidatePath("/", "layout");
}
