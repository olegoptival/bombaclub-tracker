import { auth } from "@/auth";
import { db } from "@/lib/db";

export type AppUser = {
  id: string;
  login: string;
  display_name: string;
  isSuperuser: boolean;
};

export type ClubContext = {
  member_id: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  role: "player" | "host";
  nickname: string;
  current_balance: string; // serialized Decimal — render-safe
  settlement_period: string;
  dispute_window_days: number;
};

export type AppContext = {
  user: AppUser;
  // memberships across all clubs the user has access to
  clubs: ClubContext[];
  // currently active club, if user picked one (or has only one)
  activeClub: ClubContext | null;
};

/**
 * Loads the current authenticated user with their club memberships.
 * Throws if not authenticated — callers should ensure middleware has gated.
 */
export async function getAppContext(): Promise<AppContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("getAppContext called without an authenticated session");
  }

  const userRow = await db.users.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      login: true,
      display_name: true,
      is_superuser: true,
      current_club_id: true,
      club_members_club_members_user_idTousers: {
        where: { status: "active" },
        include: {
          clubs: {
            select: {
              id: true,
              name: true,
              slug: true,
              settlement_period: true,
              dispute_window_days: true,
            },
          },
        },
        orderBy: { joined_at: "asc" },
      },
    },
  });

  if (!userRow) {
    throw new Error(`User ${session.user.id} not found in database`);
  }

  const clubs: ClubContext[] = userRow.club_members_club_members_user_idTousers.map(
    (m) => ({
      member_id: m.id,
      club_id: m.club_id,
      club_name: m.clubs.name,
      club_slug: m.clubs.slug,
      role: m.role as "player" | "host",
      nickname: m.nickname,
      current_balance: m.current_balance.toFixed(2),
      settlement_period: m.clubs.settlement_period,
      dispute_window_days: m.clubs.dispute_window_days,
    })
  );

  // Resolve active club: stored preference, else first one
  const stored = userRow.current_club_id;
  const activeClub =
    clubs.find((c) => c.club_id === stored) ?? clubs[0] ?? null;

  return {
    user: {
      id: userRow.id,
      login: userRow.login,
      display_name: userRow.display_name,
      isSuperuser: userRow.is_superuser,
    },
    clubs,
    activeClub,
  };
}
