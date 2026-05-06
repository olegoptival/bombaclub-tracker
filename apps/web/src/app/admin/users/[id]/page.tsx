import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { EditUserPanels } from "./edit-panels";

export const metadata = { title: "Edit user · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await db.users.findUnique({
    where: { id },
    include: {
      club_members_club_members_user_idTousers: {
        include: { clubs: { select: { id: true, name: true, slug: true } } },
        orderBy: { joined_at: "asc" },
      },
    },
  });
  if (!user) notFound();

  const allClubs = await db.clubs.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const memberships = user.club_members_club_members_user_idTousers.map((m) => ({
    id: m.id,
    club_id: m.club_id,
    club_name: m.clubs.name,
    club_slug: m.clubs.slug,
    role: m.role as "player" | "host",
    nickname: m.nickname,
    status: m.status as "active" | "inactive",
    current_balance: m.current_balance.toString(),
  }));

  const memberClubIds = new Set(memberships.map((m) => m.club_id));
  const availableClubs = allClubs.filter((c) => !memberClubIds.has(c.id));

  return (
    <div>
      <Link
        href="/admin/users"
        style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}
      >
        ← Back to users
      </Link>

      <div style={{ marginTop: 14, marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {user.display_name}
        </h1>
        <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
          <span data-mono>{user.login}</span>
          {user.is_superuser && (
            <span
              style={{
                marginLeft: 8,
                padding: "1px 7px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.04,
                textTransform: "uppercase",
                background: "var(--accent-soft)",
                color: "var(--accent-hi)",
                borderRadius: 999,
              }}
            >
              Admin
            </span>
          )}
          {user.password_changed_at === null && (
            <span
              style={{
                marginLeft: 6,
                padding: "1px 7px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.04,
                textTransform: "uppercase",
                background: "var(--bg-3)",
                color: "var(--fg-2)",
                borderRadius: 999,
              }}
            >
              Temp pw
            </span>
          )}
        </div>
      </div>

      <EditUserPanels
        user={{
          id: user.id,
          login: user.login,
          display_name: user.display_name,
          is_superuser: user.is_superuser,
        }}
        memberships={memberships}
        availableClubs={availableClubs}
      />
    </div>
  );
}
