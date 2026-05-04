"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type CreateClubState = { error?: string; success?: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, digits, and dashes.")
    .min(2)
    .max(60)
    .optional()
    .or(z.literal("")),
  settlement_period: z.enum(["day", "week", "month", "manual"]),
  dispute_window_days: z.coerce.number().int().min(0).max(60),
  required_aliases: z.string().trim().min(1, "At least one platform required."),
});

export async function createClubAction(
  _prev: CreateClubState,
  formData: FormData
): Promise<CreateClubState> {
  const session = await auth();
  if (!session?.user?.isSuperuser) return { error: "Forbidden." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    settlement_period: formData.get("settlement_period"),
    dispute_window_days: formData.get("dispute_window_days"),
    required_aliases: formData.get("required_aliases"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data = parsed.data;
  const finalSlug = data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);

  const aliases = data.required_aliases
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (aliases.length === 0) {
    return { error: "At least one platform required." };
  }

  const existing = await db.clubs.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    return { error: `Slug "${finalSlug}" is already taken.` };
  }

  await db.clubs.create({
    data: {
      name: data.name,
      slug: finalSlug,
      settlement_period: data.settlement_period,
      dispute_window_days: data.dispute_window_days,
      required_aliases: aliases,
      created_by: session.user.id,
    },
  });

  revalidatePath("/admin/clubs");
  return { success: `Club "${data.name}" created.` };
}
