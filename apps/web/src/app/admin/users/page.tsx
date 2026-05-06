import Link from "next/link";
import { db } from "@/lib/db";
import { CreateUserForm } from "./create-form";

export const metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, clubs] = await Promise.all([
    db.users.findMany({
      orderBy: { created_at: "desc" },
      include: {
        club_members_club_members_user_idTousers: {
          include: { clubs: { select: { name: true, slug: true } } },
        },
      },
    }),
    db.clubs.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Users
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2 }}>
          {users.length} {users.length === 1 ? "user" : "users"} in the system.
        </p>
      </div>

      <CreateUserForm clubs={clubs} />

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        {users.map((u) => {
          const memberships = u.club_members_club_members_user_idTousers;
          return (
            <div
              key={u.id}
              className="pkr-card"
              style={{
                padding: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{u.display_name}</span>
                  {u.is_superuser && (
                    <span
                      style={{
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
                  {u.password_changed_at === null && (
                    <span
                      style={{
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
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--fg-2)",
                    marginTop: 2,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span data-mono>{u.login}</span>
                  {memberships.length > 0 ? (
                    <>
                      <span>•</span>
                      <span>
                        {memberships
                          .map(
                            (m) =>
                              `${m.clubs.name} (${m.role}${
                                m.nickname !== u.display_name ? `, "${m.nickname}"` : ""
                              })`
                          )
                          .join(", ")}
                      </span>
                    </>
                  ) : !u.is_superuser ? (
                    <>
                      <span>•</span>
                      <span style={{ color: "var(--status-warning)" }}>
                        Not in any club
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <Link
                href={`/admin/users/${u.id}`}
                className="pkr-btn pkr-btn--ghost pkr-btn--sm"
                style={{ height: 32 }}
              >
                Edit
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
